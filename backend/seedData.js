const mongoose = require("mongoose")
const Product = require("./models/Product")
require("dotenv").config()

const sampleProducts = [
  {
    name: "iPhone 14 Pro Max 256GB",
    description:
      "Latest Apple iPhone 14 Pro Max with 256GB storage in pristine condition. Features the powerful A16 Bionic chip, Pro camera system, and stunning Super Retina XDR display.",
    image: "https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg",
    startingBid: 800,
    currentBid: 800,
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: "active",
    category: "Electronics",
    condition: "Like New",
    reservePrice: 900,
    tags: ["smartphone", "apple", "ios", "camera"],
    specifications: {
      Storage: "256GB",
      Color: "Deep Purple",
      Condition: "Like New",
      Warranty: "6 months remaining",
    },
  },
  {
    name: "Pen",
    description: "Smooth writing Jiffy Gel Pen in vibrant red. Perfect for everyday use, school, or office. Features a comfortable grip and consistent ink flow.",
    image: "https://www.rapiddeliveryservices.in/uploads/webp/jiffy_gel_pen_red_58189-.webp",
    startingBid: 1,
    currentBid: 1,
    startTime: "2025-06-24T17:34:47.000Z",
    endTime: "2025-06-25T17:34:47.000Z",
    status: "active",
    category: "Electronics",
    condition: "New",
    reservePrice: 3,
    tags: ["pen", "gel pen", "red ink", "stationery"],
    specifications: {
      InkColor: "Red",
      Type: "Gel Pen",
      Brand: "Jiffy",
      Quantity: "1"
    },
  },
  {
    name: "MacBook Pro M2 13-inch",
    description:
      "13-inch MacBook Pro with M2 chip, 16GB unified memory, and 512GB SSD storage. Perfect for professionals and creatives.",
    image: "https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg",
    startingBid: 1200,
    currentBid: 1200,
    startTime: new Date(),
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: "active",
    category: "Electronics",
    condition: "Good",
    reservePrice: 1400,
    tags: ["laptop", "apple", "macbook", "professional"],
    specifications: {
      Processor: "Apple M2",
      Memory: "16GB",
      Storage: "512GB SSD",
      Screen: "13.3-inch Retina",
    },
  },
  {
    name: "Vintage Rolex Submariner",
    description:
      "Authentic vintage Rolex Submariner in excellent condition. A timeless piece for collectors and enthusiasts.",
    image: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg",
    startingBid: 5000,
    currentBid: 5000,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
    status: "upcoming",
    category: "Jewelry",
    condition: "Good",
    reservePrice: 6000,
    tags: ["watch", "rolex", "luxury", "vintage"],
    specifications: {
      Model: "Submariner",
      Year: "1985",
      Material: "Stainless Steel",
      Movement: "Automatic",
    },
  },
  {
    name: "Gaming PC RTX 4080 Setup",
    description:
      "High-end gaming PC with RTX 4080, 32GB RAM, and complete setup including monitor, keyboard, and mouse.",
    image: "https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg",
    startingBid: 2000,
    currentBid: 2000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
    status: "active",
    category: "Electronics",
    condition: "New",
    reservePrice: 2500,
    tags: ["gaming", "pc", "rtx", "computer"],
    specifications: {
      GPU: "RTX 4080",
      CPU: "Intel i7-13700K",
      RAM: "32GB DDR5",
      Storage: "1TB NVMe SSD",
    },
  },
  {
    name: "Canon EOS R5 Camera",
    description:
      "Professional mirrorless camera with 45MP sensor, 8K video recording, and dual card slots. Includes 24-70mm lens.",
    image: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg",
    startingBid: 1800,
    currentBid: 1800,
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 60 * 1000),
    status: "active",
    category: "Electronics",
    condition: "Like New",
    reservePrice: 2200,
    tags: ["camera", "canon", "photography", "professional"],
    specifications: {
      Sensor: "45MP Full Frame",
      Video: "8K RAW",
      Lens: "24-70mm f/2.8",
      Condition: "Like New",
    },
  },
  {
    name: "Tesla Model 3 Performance",
    description:
      "2022 Tesla Model 3 Performance with autopilot, premium interior, and low mileage. Excellent condition.",
    image: "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg",
    startingBid: 45000,
    currentBid: 45000,
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 120 * 60 * 60 * 1000),
    status: "upcoming",
    category: "Vehicles",
    condition: "Good",
    reservePrice: 50000,
    tags: ["tesla", "electric", "performance", "autopilot"],
    specifications: {
      Year: "2022",
      Mileage: "15,000 miles",
      Color: "Pearl White",
      Features: "Autopilot, Premium Interior",
    },
  },
]

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...")

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Voxta")

    console.log("✅ Connected to MongoDB")

    // Clear existing products
    const deleteResult = await Product.deleteMany({})
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing products`)

    // Insert sample products
    const insertResult = await Product.insertMany(sampleProducts)
    console.log(`📦 Inserted ${insertResult.length} sample products`)

    // Display inserted products
    console.log("\n📋 Inserted Products:")
    insertResult.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.startingBid} (${product.status})`)
    })

    console.log("\n🎉 Database seeded successfully!")
    console.log("🚀 You can now start the server with: npm start")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Database connection closed")
    process.exit(0)
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase, sampleProducts }