import type { User, Event, Category, Product, EventProduct, AuditEntry } from './types'

export const users: User[] = [
  { id: '1', name: 'Riya Agarwal', email: 'flora@company.com', role: 'admin', createdAt: '2026-01-15' },
  { id: '2', name: 'Suresh Kumar', email: 'suresh@company.com', role: 'staff', createdAt: '2026-02-10' },
  { id: '3', name: 'Priya Mehta', email: 'member@company.com', role: 'staff_member', createdAt: '2026-03-05' },
]


export const categories: Category[] = []

export const products: Product[] = []

export const events: Event[] = [
  { id: '1', name: 'Sharma Wedding', occasionType: 'wedding', eventDate: '2026-04-14', venueName: 'The Grand Banquet Hall', venueAddress: '123 MG Road, Bangalore', contactName: 'Rahul Sharma', contactPhone: '9876543210', status: 'live', createdAt: '2026-03-01', updatedAt: '2026-04-06' },
  { id: '2', name: 'The Golden Cocktail', occasionType: 'cocktail', eventDate: '2026-04-18', venueName: 'Hyatt Regency', venueAddress: 'Ring Road, Hyderabad', contactName: 'Amit Verma', contactPhone: '9123456789', status: 'live', createdAt: '2026-02-15', updatedAt: '2026-04-05' },
  { id: '3', name: 'Iyer Bhaat Ceremony', occasionType: 'bhaat', eventDate: '2026-04-09', venueName: 'Green Valley Resort', venueAddress: 'Outer Ring Road, Chennai', contactName: 'Lakshmi Iyer', contactPhone: '9988776655', status: 'live', createdAt: '2026-03-20', updatedAt: '2026-04-06' },
  { id: '4', name: 'Patel Pooja', occasionType: 'other', eventDate: '2026-04-07', venueName: 'Home Venue, Vasant Vihar', venueAddress: 'Vasant Vihar, Delhi', contactName: 'Mahesh Patel', contactPhone: '9876501234', status: 'live', createdAt: '2026-03-25', updatedAt: '2026-04-06' },
  { id: '5', name: 'Gupta Haldi', occasionType: 'haldi', eventDate: '2026-04-22', venueName: 'Leela Palace', venueAddress: 'Diplomatic Enclave, Delhi', contactName: 'Neha Gupta', contactPhone: '9812345678', status: 'live', createdAt: '2026-03-10', updatedAt: '2026-04-04' },
  { id: '6', name: 'Kapoor Mehandi', occasionType: 'mehandi', eventDate: '2026-04-30', venueName: 'Community Hall', venueAddress: 'Sector 21, Gurgaon', contactName: 'Vijay Singh', contactPhone: '9654321098', status: 'live', createdAt: '2026-03-15', updatedAt: '2026-04-01' },
  { id: '7', name: 'Malhotra Wedding', occasionType: 'wedding', eventDate: '2026-03-02', venueName: 'Royal Palace', venueAddress: 'Juhu Beach, Mumbai', closedBy: 'Riya Agarwal', status: 'finished', createdAt: '2026-01-20', updatedAt: '2026-03-03' },
  { id: '8', name: 'Grand After Party', occasionType: 'after_party', eventDate: '2026-02-28', venueName: 'Taj Hotel', venueAddress: 'Colaba, Mumbai', closedBy: 'Riya Agarwal', status: 'hold', createdAt: '2026-01-10', updatedAt: '2026-03-01' },
  { id: '9', name: 'Reddy Reception', occasionType: 'reception', eventDate: '2026-02-15', venueName: 'Marriott Hotel', venueAddress: 'Whitefield, Bangalore', closedBy: 'Riya Agarwal', status: 'finished', createdAt: '2026-01-05', updatedAt: '2026-02-16' },
  { id: '10', name: 'Diwali Night', occasionType: 'other', eventDate: '2026-03-15', venueName: 'City Convention Center', venueAddress: 'MG Road, Pune', closedBy: 'Suresh Kumar', status: 'hold', createdAt: '2026-02-01', updatedAt: '2026-03-16' },
]



export const eventProducts: EventProduct[] = [
  { id: '1', eventId: '1', productId: '1', productName: 'Roses', categoryId: '1', categoryName: 'Flowers', quantity: 50, unit: 'bunch', price: 500 },
  { id: '2', eventId: '1', productId: '2', productName: 'Marigold', categoryId: '1', categoryName: 'Flowers', quantity: 200, unit: 'pcs', price: 200 },
  { id: '3', eventId: '1', productId: '4', productName: 'Jasmine', categoryId: '1', categoryName: 'Flowers', quantity: 15, unit: 'kg' },
  { id: '4', eventId: '1', productId: '12', productName: 'Wedding Cake', categoryId: '2', categoryName: 'Cakes', quantity: 2, unit: 'pcs', price: 4500 },
  { id: '5', eventId: '1', productId: '23', productName: 'Pooja Thali', categoryId: '5', categoryName: 'Brass Items', quantity: 5, unit: 'set', price: 1200 },
  { id: '6', eventId: '1', productId: '28', productName: 'Fairy Lights', categoryId: '6', categoryName: 'Accessories', quantity: 100, unit: 'metre', price: 50 },
  { id: '7', eventId: '1', productId: '31', productName: 'Artificial Rose Garland', categoryId: '7', categoryName: 'Artificial Flowers', quantity: 20, unit: 'metre', price: 300 },
  { id: '8', eventId: '1', productId: '20', productName: 'Assorted Chocolates', categoryId: '4', categoryName: 'Chocolates', quantity: 10, unit: 'box', price: 800 },
  { id: '9', eventId: '2', productId: '28', productName: 'Fairy Lights', categoryId: '6', categoryName: 'Accessories', quantity: 200, unit: 'metre', price: 50 },
  { id: '10', eventId: '2', productId: '30', productName: 'Balloons', categoryId: '6', categoryName: 'Accessories', quantity: 500, unit: 'pcs', price: 10 },
  { id: '11', eventId: '2', productId: '15', productName: 'Pastries', categoryId: '2', categoryName: 'Cakes', quantity: 20, unit: 'box', price: 500 },
  { id: '12', eventId: '2', productId: '21', productName: 'Premium Chocolates', categoryId: '4', categoryName: 'Chocolates', quantity: 15, unit: 'box', price: 1500 },
  { id: '13', eventId: '2', productId: '17', productName: 'Mixed Fruit Basket', categoryId: '3', categoryName: 'Fruit Baskets', quantity: 10, unit: 'set', price: 1500 },
  { id: '14', eventId: '3', productId: '13', productName: 'Birthday Cake', categoryId: '2', categoryName: 'Cakes', quantity: 1, unit: 'pcs', price: 1500 },
  { id: '15', eventId: '3', productId: '30', productName: 'Balloons', categoryId: '6', categoryName: 'Accessories', quantity: 100, unit: 'pcs', price: 10 },
  { id: '16', eventId: '3', productId: '14', productName: 'Cupcakes', categoryId: '2', categoryName: 'Cakes', quantity: 3, unit: 'dozen', price: 800 },
  { id: '17', eventId: '4', productId: '2', productName: 'Marigold', categoryId: '1', categoryName: 'Flowers', quantity: 500, unit: 'pcs', price: 20 },
  { id: '18', eventId: '4', productId: '4', productName: 'Jasmine', categoryId: '1', categoryName: 'Flowers', quantity: 5, unit: 'kg' },
  { id: '19', eventId: '4', productId: '23', productName: 'Pooja Thali', categoryId: '5', categoryName: 'Brass Items', quantity: 3, unit: 'set', price: 1200 },
  { id: '20', eventId: '4', productId: '24', productName: 'Diya Set', categoryId: '5', categoryName: 'Brass Items', quantity: 10, unit: 'set', price: 600 },
  { id: '21', eventId: '4', productId: '25', productName: 'Bell', categoryId: '5', categoryName: 'Brass Items', quantity: 2, unit: 'pcs', price: 400 },
  { id: '22', eventId: '4', productId: '26', productName: 'Kalash', categoryId: '5', categoryName: 'Brass Items', quantity: 1, unit: 'pcs', price: 800 },
  { id: '23', eventId: '5', productId: '1', productName: 'Roses', categoryId: '1', categoryName: 'Flowers', quantity: 25, unit: 'bunch', price: 500 },
  { id: '24', eventId: '5', productId: '12', productName: 'Wedding Cake', categoryId: '2', categoryName: 'Cakes', quantity: 1, unit: 'pcs', price: 4500 },
  { id: '25', eventId: '5', productId: '22', productName: 'Chocolate Hamper', categoryId: '4', categoryName: 'Chocolates', quantity: 5, unit: 'set', price: 2500 },
  { id: '26', eventId: '5', productId: '28', productName: 'Fairy Lights', categoryId: '6', categoryName: 'Accessories', quantity: 50, unit: 'metre', price: 50 },
  { id: '27', eventId: '6', productId: '32', productName: 'Artificial Marigold Garland', categoryId: '7', categoryName: 'Artificial Flowers', quantity: 50, unit: 'metre', price: 200 },
  { id: '28', eventId: '6', productId: '30', productName: 'Balloons', categoryId: '6', categoryName: 'Accessories', quantity: 200, unit: 'pcs', price: 10 },
]

export const auditLog: AuditEntry[] = [
  { id: '1', timestamp: '2026-04-06T14:32:05', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Event Row', entityName: 'Sharma Wedding', change: 'Roses - Quantity: 30 to 50' },
  { id: '2', timestamp: '2026-04-06T11:17:42', userId: '2', userName: 'Suresh Kumar', action: 'Created', entityType: 'Product', entityName: 'Marigold', change: 'Added to Flowers category' },
  { id: '3', timestamp: '2026-04-05T16:45:30', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Event', entityName: 'TechCorp Annual Day', change: 'Venue changed to Hyatt Regency' },
  { id: '4', timestamp: '2026-04-05T14:20:15', userId: '3', userName: 'Priya Mehta', action: 'Updated', entityType: 'Event Row', entityName: 'Iyer Birthday Party', change: 'Balloons - Quantity: 50 to 100' },
  { id: '5', timestamp: '2026-04-05T10:05:00', userId: '2', userName: 'Suresh Kumar', action: 'Created', entityType: 'Event Row', entityName: 'Patel Pooja Ceremony', change: 'Added Diya Set (10 sets)' },
  { id: '6', timestamp: '2026-04-04T17:30:22', userId: '1', userName: 'Riya Agarwal', action: 'Created', entityType: 'Event', entityName: 'Spring Festival', change: 'New event created' },
  { id: '7', timestamp: '2026-04-04T15:12:45', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Category', entityName: 'Accessories', change: 'Product count updated' },
  { id: '8', timestamp: '2026-04-03T11:45:33', userId: '2', userName: 'Suresh Kumar', action: 'Deleted', entityType: 'Event Row', entityName: 'Gupta Anniversary', change: 'Removed Candles from event' },
  { id: '9', timestamp: '2026-04-03T09:20:18', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'User', entityName: 'Priya Mehta', change: 'Role changed to Staff Member' },
  { id: '10', timestamp: '2026-04-02T16:55:40', userId: '1', userName: 'Riya Agarwal', action: 'Created', entityType: 'Product', entityName: 'Artificial Rose Garland', change: 'Added to Artificial Flowers category' },
  { id: '11', timestamp: '2026-04-02T14:30:00', userId: '2', userName: 'Suresh Kumar', action: 'Updated', entityType: 'Event Row', entityName: 'Sharma Wedding', change: 'Fairy Lights - Quantity: 50 to 100' },
  { id: '12', timestamp: '2026-04-01T18:22:15', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Event', entityName: 'Sharma Wedding', change: 'Contact phone updated' },
  { id: '13', timestamp: '2026-04-01T12:10:30', userId: '3', userName: 'Priya Mehta', action: 'Updated', entityType: 'Event Row', entityName: 'TechCorp Annual Day', change: 'Balloons - Unit: dozen to pcs' },
  { id: '14', timestamp: '2026-03-31T15:45:22', userId: '2', userName: 'Suresh Kumar', action: 'Created', entityType: 'Event Row', entityName: 'Sharma Wedding', change: 'Added Assorted Chocolates (10 box)' },
  { id: '15', timestamp: '2026-03-30T10:30:00', userId: '1', userName: 'Riya Agarwal', action: 'Created', entityType: 'Event', entityName: 'Gupta Anniversary', change: 'New event created' },
  { id: '16', timestamp: '2026-03-29T14:20:45', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Product', entityName: 'Tuberose', change: 'Status changed to Inactive' },
  { id: '17', timestamp: '2026-03-28T11:15:30', userId: '2', userName: 'Suresh Kumar', action: 'Created', entityType: 'Category', entityName: 'Artificial Flowers', change: 'New category created' },
  { id: '18', timestamp: '2026-03-27T16:40:18', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Event', entityName: 'XYZ Corp Annual Day', change: 'Status changed to Hold' },
  { id: '19', timestamp: '2026-03-26T09:55:00', userId: '1', userName: 'Riya Agarwal', action: 'Updated', entityType: 'Event', entityName: 'Kapoor Wedding', change: 'Status changed to Finished' },
  { id: '20', timestamp: '2026-03-25T13:30:22', userId: '2', userName: 'Suresh Kumar', action: 'Created', entityType: 'User', entityName: 'Priya Mehta', change: 'New user invited as Staff Member' },
]
