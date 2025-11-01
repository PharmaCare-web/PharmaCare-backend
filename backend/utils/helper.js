// Utility functions
// Helper functions for common operations

const fs = require('fs').promises;
const path = require('path');

// Read users data from JSON file
const readUsersData = async () => {
  try {
    const filePath = path.join(__dirname, '../data/users.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

// Write users data to JSON file
const writeUsersData = async (users) => {
  try {
    const filePath = path.join(__dirname, '../data/users.json');
    await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    throw error;
  }
};

// Generate unique ID
const generateId = (items) => {
  if (items.length === 0) return 1;
  const maxId = Math.max(...items.map(item => item.id));
  return maxId + 1;
};

// Format date
const formatDate = (date) => {
  return new Date(date).toISOString();
};

// Validate required fields
const validateRequired = (data, fields) => {
  const missing = [];
  fields.forEach(field => {
    if (!data[field] || data[field].toString().trim().length === 0) {
      missing.push(field);
    }
  });
  return {
    isValid: missing.length === 0,
    missing
  };
};

module.exports = {
  readUsersData,
  writeUsersData,
  generateId,
  formatDate,
  validateRequired
};

