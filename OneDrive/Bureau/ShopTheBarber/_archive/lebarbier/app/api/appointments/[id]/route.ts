import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';
import { z } from 'zod';

// Validation schemas
const updateAppointmentSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().max(500).optional(),
  clientNotes: z.string().max(500).optional(),
  barberNotes: z.string().max(500).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'refunded']).optional(),
  depositAmount: z.number().min(0).optional(),
});

interface AppointmentDetails {
  id: string;
  client_id: string;
  barber_id: string;
  service_ids: string[];
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  client_notes: string | null;
  barber_notes: string | null;
  total_price: number;
  deposit_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  barber: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    barber_profiles: {
      business_name: string | null;
      phone: string | null;
    };
  };
}

// GET /api/appointments/[id] - Get appointment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const supabase = createClient();

    // Get appointment with full details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        client_id,
        barber_id,
        service_ids,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        client_notes,
        barber_notes,
        total_price,
        deposit_amount,
        payment_status,
        booking_source,
        reminder_sent,
        confirmation_sent,
        created_at,
        updated_at,
        client:users!appointments_client_id_fkey (
          id,
          name,
          email,
          phone,
          avatar_url
        ),
        barber:users!appointments_barber_id_fkey (
          id,
          name,
          email,
          phone,
          avatar_url,
          barber_profiles (
            business_name,
            phone,
            address_street,
            address_city,
            address_state,
            address_postal_code
          )
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const typedAppointment = appointment as AppointmentDetails;

    // Check if user has permission to view this appointment
    if (typedAppointment.client_id !== userId && typedAppointment.barber_id !== userId) {
      // Check if user is admin
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Get service details
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, description, duration, price, category')
      .in('id', typedAppointment.service_ids);

    if (servicesError) {
      console.error('Services query error:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch service details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointment: {
        ...typedAppointment,
        services: services || [],
        totalPrice: parseFloat(typedAppointment.total_price.toString()),
        depositAmount: parseFloat(typedAppointment.deposit_amount.toString()),
      },
    });

  } catch (error) {
    console.error('Get appointment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    const supabase = createClient();

    // Get current appointment to check permissions
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, client_id, barber_id, status, appointment_date, start_time')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions based on user role and appointment ownership
    const isClient = currentAppointment.client_id === userId;
    const isBarber = currentAppointment.barber_id === userId;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isBarber && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate status transitions and permissions
    if (validatedData.status) {
      const currentStatus = currentAppointment.status;
      const newStatus = validatedData.status;

      // Define allowed status transitions
      const allowedTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'completed', 'cancelled', 'no_show'],
        in_progress: ['completed', 'cancelled'],
        completed: [], // Completed appointments cannot be changed
        cancelled: ['pending'], // Only admin can reactivate
        no_show: ['pending'], // Only admin can reactivate
      };

      // Check if transition is allowed
      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        // Special cases for admin
        if (!isAdmin || (currentStatus === 'completed' && newStatus !== 'completed')) {
          return NextResponse.json(
            { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
            { status: 400 }
          );
        }
      }

      // Role-specific restrictions
      if (isClient) {
        // Clients can only cancel pending/confirmed appointments
        if (newStatus !== 'cancelled' || !['pending', 'confirmed'].includes(currentStatus)) {
          return NextResponse.json(
            { error: 'Clients can only cancel pending or confirmed appointments' },
            { status: 403 }
          );
        }
      } else if (isBarber) {
        // Barbers cannot set appointments to cancelled (only no_show)
        if (newStatus === 'cancelled') {
          return NextResponse.json(
            { error: 'Barbers cannot cancel appointments. Use no_show status instead.' },
            { status: 403 }
          );
        }
      }
    }

    // Prepare update data based on user role
    const updateData: any = {};

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.clientNotes !== undefined && (isClient || isAdmin)) {
      updateData.client_notes = validatedData.clientNotes;
    }

    if (validatedData.barberNotes !== undefined && (isBarber || isAdmin)) {
      updateData.barber_notes = validatedData.barberNotes;
    }

    if (validatedData.paymentStatus !== undefined && (isBarber || isAdmin)) {
      updateData.payment_status = validatedData.paymentStatus;
    }

    if (validatedData.depositAmount !== undefined && (isBarber || isAdmin)) {
      updateData.deposit_amount = validatedData.depositAmount;
    }

    // Check if appointment is in the past for certain updates
    const appointmentDateTime = new Date(`${currentAppointment.appointment_date}T${currentAppointment.start_time}`);
    const now = new Date();
    
    if (appointmentDateTime < now && validatedData.status && 
        !['completed', 'no_show'].includes(validatedData.status)) {
      return NextResponse.json(
        { error: 'Cannot modify past appointments except to mark as completed or no-show' },
        { status: 400 }
      );
    }

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        id,
        client_id,
        barber_id,
        service_ids,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        client_notes,
        barber_notes,
        total_price,
        deposit_amount,
        payment_status,
        updated_at,
        client:users!appointments_client_id_fkey (
          id,
          name,
          email
        ),
        barber:users!appointments_barber_id_fkey (
          id,
          name,
          email,
          barber_profiles (
            business_name
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Update appointment error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Get service details
    const { data: services } = await supabase
      .from('services')
      .select('id, name, duration, price')
      .in('id', updatedAppointment.service_ids);

    return NextResponse.json({
      appointment: {
        ...updatedAppointment,
        services: services || [],
        totalPrice: parseFloat(updatedAppointment.total_price.toString()),
        depositAmount: parseFloat(updatedAppointment.deposit_amount.toString()),
      },
      message: 'Appointment updated successfully',
    });

  } catch (error) {
    console.error('Update appointment API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel/Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const supabase = createClient();

    // Get appointment to check permissions and status
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, client_id, barber_id, status, appointment_date, start_time')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Get user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isClient = appointment.client_id === userId;
    const isBarber = appointment.barber_id === userId;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isBarber && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed appointments' },
        { status: 400 }
      );
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const now = new Date();
    
    if (appointmentDateTime < now && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot cancel past appointments' },
        { status: 400 }
      );
    }

    // For soft delete, update status to cancelled instead of actual deletion
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        barber_notes: isBarber ? 'Cancelled by barber' : appointment.barber_notes,
        client_notes: isClient ? 'Cancelled by client' : appointment.client_notes,
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Cancel appointment error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appointment cancelled successfully',
    });

  } catch (error) {
    console.error('Cancel appointment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}