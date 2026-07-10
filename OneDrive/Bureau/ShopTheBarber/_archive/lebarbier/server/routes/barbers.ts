import { RequestHandler } from "express";
import { query, get, run } from '../database/db.js';
import searchService from '../services/searchService.js';

// GET /api/barbers - Get all barbers with advanced filtering
export const handleGetBarbers: RequestHandler = async (req, res) => {
  try {
    const {
      services,
      location,
      locationType,
      latitude,
      longitude,
      maxDistance,
      minRating,
      maxRating,
      serviceCategory,
      acceptsHome,
      acceptsShop,
      isVerified,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    // Use the search service for advanced filtering
    const filters = {
      location: location as string,
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      maxDistance: maxDistance ? parseFloat(maxDistance as string) : 50,
      minRating: minRating ? parseFloat(minRating as string) : 0,
      maxRating: maxRating ? parseFloat(maxRating as string) : 5,
      serviceCategory: serviceCategory as string,
      acceptsHome: acceptsHome !== undefined ? acceptsHome === 'true' : null,
      acceptsShop: acceptsShop !== undefined ? acceptsShop === 'true' : null,
      isVerified: isVerified !== undefined ? isVerified === 'true' : null,
      sortBy: sortBy as string || 'rating',
      sortOrder: sortOrder as string || 'DESC',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    };

    // Apply location type filter
    if (locationType === 'home') {
      filters.acceptsHome = true;
    } else if (locationType === 'shop') {
      filters.acceptsShop = true;
    }

    // Apply service filter
    if (services) {
      const serviceIds = services.toString().split(',');
      // This will be handled in the search service
    }

    const result = await searchService.searchBarbers(filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting barbers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/barbers/nearby - Get nearby barbers using geolocation
export const handleGetNearbyBarbers: RequestHandler = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance, limit } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const nearbyBarbers = await searchService.getNearbyBarbers(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      maxDistance ? parseFloat(maxDistance as string) : 50,
      limit ? parseInt(limit as string) : 20
    );

    res.json(nearbyBarbers);
  } catch (error) {
    console.error('Error getting nearby barbers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/barbers/location/:location - Get barbers by location
export const handleGetBarbersByLocation: RequestHandler = async (req, res) => {
  try {
    const { location } = req.params;
    const { latitude, longitude, maxDistance } = req.query;

    const barbers = await searchService.getBarbersByLocation(
      location,
      latitude ? parseFloat(latitude as string) : undefined,
      longitude ? parseFloat(longitude as string) : undefined,
      maxDistance ? parseFloat(maxDistance as string) : 50
    );

    res.json(barbers);
  } catch (error) {
    console.error('Error getting barbers by location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/barbers/:id - Get barber by ID
export const handleGetBarberById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await get(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT s.name) as service_names,
        GROUP_CONCAT(DISTINCT s.category) as service_categories,
        COUNT(DISTINCT r.id) as review_count,
        AVG(r.rating) as avg_rating
      FROM barbers b
      LEFT JOIN barber_services bs ON b.id = bs.barber_id
      LEFT JOIN services s ON bs.service_id = s.id
      LEFT JOIN reviews r ON b.id = r.barber_id
      WHERE b.id = ? AND b.is_active = 1
      GROUP BY b.id
    `, [id]);

    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    // Get barber services
    const services = await query(`
      SELECT s.*, bs.price, bs.duration
      FROM barber_services bs
      JOIN services s ON bs.service_id = s.id
      WHERE bs.barber_id = ?
      ORDER BY s.category, s.name
    `, [id]);

    // Get recent reviews
    const reviews = await query(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE r.barber_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);

    // Get availability
    const availability = await query(`
      SELECT * FROM barber_availability
      WHERE barber_id = ?
      ORDER BY day_of_week, start_time
    `, [id]);

    res.json({
      ...barber,
      services,
      reviews,
      availability
    });
  } catch (error) {
    console.error('Error getting barber by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/barbers/:id/update-location - Update barber location coordinates
export const handleUpdateBarberLocation: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    await run(`
      UPDATE barbers 
      SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [latitude, longitude, id]);

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating barber location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/barbers/:id/update-tags - Update barber search tags
export const handleUpdateBarberTags: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    await searchService.updateBarberSearchTags(id, tags);
    res.json({ message: 'Search tags updated successfully' });
  } catch (error) {
    console.error('Error updating barber tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mock data for backward compatibility
const mockBarbers = [
  {
    id: 1,
    name: "Ahmed Benali",
    salon_name: "Elite Barber Shop",
    rating: 4.9,
    location: "Casablanca",
    latitude: 33.5731,
    longitude: -7.5898,
    description: "Expert en coupes modernes et traditionnelles",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    is_verified: true,
    review_count: 156,
    services: ["coupe", "barbe", "styling", "rasage"],
    priceList: {
      coupe: 60,
      barbe: 40,
      styling: 30,
      rasage: 50,
    },
    comboOffers: [
      {
        services: ["coupe", "barbe"],
        discount: 10,
      },
    ],
    timeOffers: [
      {
        days: [1, 2, 3], // Monday to Wednesday
        startHour: 9,
        endHour: 12,
        discount: 15,
      },
    ],
  },
  {
    id: 2,
    name: "Omar Mansouri",
    salon_name: "Royal Cut",
    rating: 4.8,
    location: "Marrakech",
    latitude: 31.6295,
    longitude: -7.9811,
    description: "Spécialiste des coupes premium et soins de barbe",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    is_verified: true,
    review_count: 134,
    services: ["coupe", "barbe", "soin-visage"],
    priceList: {
      coupe: 80,
      barbe: 50,
      "soin-visage": 70,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 3,
    name: "Youssef Alami",
    salon_name: "Modern Style",
    rating: 4.7,
    location: "Rabat",
    latitude: 34.0209,
    longitude: -6.8416,
    description: "Innovation et style pour l'homme moderne",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    is_verified: false,
    review_count: 98,
    services: ["coupe", "styling", "shampoing"],
    priceList: {
      coupe: 70,
      styling: 35,
      shampoing: 20,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 4,
    name: "Hassan Riad",
    salon_name: "Classic Cuts",
    rating: 4.9,
    location: "Fès",
    latitude: 34.0181,
    longitude: -5.0078,
    description: "Maître barbier avec 15 ans d'expérience",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    is_verified: true,
    review_count: 201,
    services: ["coupe", "barbe", "rasage", "soin-visage"],
    priceList: {
      coupe: 65,
      barbe: 45,
      rasage: 55,
      "soin-visage": 75,
    },
    comboOffers: [
      {
        services: ["coupe", "barbe", "rasage"],
        discount: 20,
      },
    ],
    timeOffers: [],
  },
  {
    id: 5,
    name: "Karim Fassi",
    salon_name: "Urban Style",
    rating: 4.6,
    location: "Tanger",
    latitude: 35.7595,
    longitude: -5.8340,
    description: "Style urbain et tendances contemporaines",
    image_url: null,
    accepts_home: true,
    accepts_shop: true,
    is_verified: false,
    review_count: 87,
    services: ["coupe", "styling", "coloration"],
    priceList: {
      coupe: 75,
      styling: 40,
      coloration: 120,
    },
    comboOffers: [],
    timeOffers: [],
  },
  {
    id: 6,
    name: "Rachid Ouali",
    salon_name: "Premium Barbers",
    rating: 4.8,
    location: "Agadir",
    latitude: 30.4278,
    longitude: -9.5981,
    description: "Excellence et qualité premium",
    image_url: null,
    accepts_home: false,
    accepts_shop: true,
    is_verified: true,
    review_count: 145,
    services: ["coupe", "barbe", "soin-visage", "massage"],
    priceList: {
      coupe: 90,
      barbe: 60,
      "soin-visage": 80,
      massage: 100,
    },
    comboOffers: [
      {
        services: ["coupe", "barbe", "soin-visage"],
        discount: 25,
      },
    ],
    timeOffers: [],
  },
];
