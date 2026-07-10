import { query, run } from '../database/db.js';

class SearchService {
  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Search barbers with advanced filtering
   */
  async searchBarbers(filters = {}) {
    const {
      query: searchQuery = '',
      location = '',
      latitude,
      longitude,
      maxDistance = 50, // km
      minRating = 0,
      maxRating = 5,
      serviceCategory = '',
      acceptsHome = null,
      acceptsShop = null,
      isVerified = null,
      sortBy = 'rating', // 'rating', 'distance', 'name', 'review_count'
      sortOrder = 'DESC',
      page = 1,
      limit = 20
    } = filters;

    let sql = `
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
      WHERE 1=1
    `;

    const params = [];

    // Full-text search
    if (searchQuery) {
      sql += ` AND (
        b.name LIKE ? OR 
        b.salon_name LIKE ? OR 
        b.description LIKE ? OR
        b.location LIKE ? OR
        b.search_tags LIKE ?
      )`;
      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Location filter
    if (location) {
      sql += ` AND b.location LIKE ?`;
      params.push(`%${location}%`);
    }

    // Service category filter
    if (serviceCategory) {
      sql += ` AND s.category = ?`;
      params.push(serviceCategory);
    }

    // Rating filter
    if (minRating > 0) {
      sql += ` AND b.rating >= ?`;
      params.push(minRating);
    }

    if (maxRating < 5) {
      sql += ` AND b.rating <= ?`;
      params.push(maxRating);
    }

    // Location type filters
    if (acceptsHome !== null) {
      sql += ` AND b.accepts_home = ?`;
      params.push(acceptsHome);
    }

    if (acceptsShop !== null) {
      sql += ` AND b.accepts_shop = ?`;
      params.push(acceptsShop);
    }

    // Verification filter (only if column exists)
    if (isVerified !== null) {
      // Check if is_verified column exists before using it
      sql += ` AND (b.is_verified = ? OR b.is_verified IS NULL)`;
      params.push(isVerified);
    }

    sql += ` GROUP BY b.id`;

    // Rating filter on aggregated data
    if (minRating > 0 || maxRating < 5) {
      sql += ` HAVING avg_rating >= ? AND avg_rating <= ?`;
      params.push(minRating, maxRating);
    }

    // Sorting
    const validSortFields = ['rating', 'distance', 'name', 'review_count', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      if (sortBy === 'distance' && latitude && longitude) {
        // Distance sorting will be handled after query
      } else {
        sql += ` ORDER BY b.${sortBy} ${sortOrder}`;
      }
    } else {
      sql += ` ORDER BY b.rating DESC`;
    }

    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const results = await query(sql, params);
      
      // Calculate distances if coordinates provided
      if (latitude && longitude) {
        results.forEach(barber => {
          if (barber.latitude && barber.longitude) {
            barber.distance = this.calculateDistance(
              latitude, longitude, 
              barber.latitude, barber.longitude
            );
          }
        });

        // Filter by distance
        const filteredResults = results.filter(barber => 
          !barber.distance || barber.distance <= maxDistance
        );

        // Sort by distance if requested
        if (sortBy === 'distance') {
          filteredResults.sort((a, b) => {
            const distA = a.distance || Infinity;
            const distB = b.distance || Infinity;
            return sortOrder === 'ASC' ? distA - distB : distB - distA;
          });
        }

        return {
          barbers: filteredResults,
          total: filteredResults.length,
          page,
          limit,
          hasMore: filteredResults.length === limit
        };
      }

      return {
        barbers: results,
        total: results.length,
        page,
        limit,
        hasMore: results.length === limit
      };
    } catch (error) {
      console.error('Error searching barbers:', error);
      throw new Error('Failed to search barbers');
    }
  }

  /**
   * Get barbers by location with distance calculation
   */
  async getBarbersByLocation(location, latitude, longitude, maxDistance = 50) {
    const sql = `
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
      WHERE b.location LIKE ?
      GROUP BY b.id
      ORDER BY b.rating DESC
    `;

    try {
      const results = await query(sql, [`%${location}%`]);
      
      if (latitude && longitude) {
        results.forEach(barber => {
          if (barber.latitude && barber.longitude) {
            barber.distance = this.calculateDistance(
              latitude, longitude, 
              barber.latitude, barber.longitude
            );
          }
        });

        // Filter by distance and sort
        const filteredResults = results
          .filter(barber => !barber.distance || barber.distance <= maxDistance)
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

        return filteredResults;
      }

      return results;
    } catch (error) {
      console.error('Error getting barbers by location:', error);
      throw new Error('Failed to get barbers by location');
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit = 10) {
    const sql = `
      SELECT 
        location as term,
        COUNT(*) as count
      FROM barbers 
      WHERE is_active = 1 
      GROUP BY location 
      ORDER BY count DESC 
      LIMIT ?
    `;

    try {
      return await query(sql, [limit]);
    } catch (error) {
      console.error('Error getting popular search terms:', error);
      return [];
    }
  }

  /**
   * Get service categories for filtering
   */
  async getServiceCategories() {
    const sql = `
      SELECT DISTINCT category 
      FROM services 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;

    try {
      const results = await query(sql);
      return results.map(row => row.category);
    } catch (error) {
      console.error('Error getting service categories:', error);
      return [];
    }
  }

  /**
   * Update barber search tags
   */
  async updateBarberSearchTags(barberId, tags) {
    const sql = `
      UPDATE barbers 
      SET search_tags = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      const tagsJson = JSON.stringify(tags);
      await run(sql, [tagsJson, barberId]);
      return true;
    } catch (error) {
      console.error('Error updating barber search tags:', error);
      throw new Error('Failed to update search tags');
    }
  }

  /**
   * Get nearby barbers using coordinates
   */
  async getNearbyBarbers(latitude, longitude, maxDistance = 50, limit = 20) {
    const sql = `
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
      WHERE b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
      GROUP BY b.id
      ORDER BY b.rating DESC
      LIMIT ?
    `;

    try {
      const results = await query(sql, [limit]);
      
      // Calculate distances and filter
      const nearbyBarbers = results
        .map(barber => ({
          ...barber,
          distance: this.calculateDistance(
            latitude, longitude, 
            barber.latitude, barber.longitude
          )
        }))
        .filter(barber => barber.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);

      return nearbyBarbers;
    } catch (error) {
      console.error('Error getting nearby barbers:', error);
      throw new Error('Failed to get nearby barbers');
    }
  }
}

export default new SearchService(); 