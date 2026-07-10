import express from 'express';
import { RequestHandler } from "express";
import searchService from '../services/searchService.js';

const router = express.Router();

// GET /api/search/barbers - Advanced barber search with filtering
export const handleSearchBarbers: RequestHandler = async (req, res) => {
  try {
    const {
      q: searchQuery,
      location,
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

    const filters = {
      query: searchQuery as string,
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

    const result = await searchService.searchBarbers(filters);
    res.json(result);
  } catch (error) {
    console.error('Error in barber search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/search/barbers/nearby - Get nearby barbers using geolocation
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

// GET /api/search/barbers/location/:location - Get barbers by location
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

// GET /api/search/popular-terms - Get popular search terms
export const handleGetPopularSearchTerms: RequestHandler = async (req, res) => {
  try {
    const { limit } = req.query;
    const terms = await searchService.getPopularSearchTerms(
      limit ? parseInt(limit as string) : 10
    );
    res.json(terms);
  } catch (error) {
    console.error('Error getting popular search terms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/search/service-categories - Get available service categories
export const handleGetServiceCategories: RequestHandler = async (req, res) => {
  try {
    const categories = await searchService.getServiceCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error getting service categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Legacy search endpoint for backward compatibility
export const handleSearch: RequestHandler = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.json({ barbers: [], services: [] });
    }

    const result = await searchService.searchBarbers({ query: q, limit: 10 });
    res.json({ barbers: result.barbers, services: [] });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default router;
