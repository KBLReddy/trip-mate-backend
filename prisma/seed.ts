// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripmate.com' },
    update: {},
    create: {
      email: 'admin@tripmate.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create guide user
  const guidePassword = await bcrypt.hash('guide123', 10);
  const guide = await prisma.user.upsert({
    where: { email: 'guide@tripmate.com' },
    update: {},
    create: {
      email: 'guide@tripmate.com',
      name: 'Tour Guide',
      passwordHash: guidePassword,
      role: Role.GUIDE,
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@tripmate.com' },
    update: {},
    create: {
      email: 'user@tripmate.com',
      name: 'Test User',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  // Create sample posts first (before tours to avoid issues)
  const posts = [
    {
      title: 'My Amazing Bali Adventure',
      content: 'Just returned from an incredible 7-day journey through Bali. The temples, beaches, and rice terraces were absolutely breathtaking. The local culture and food exceeded all expectations!',
      imageUrl: 'https://images.unsplash.com/photo-1559628233-100c798642d4',
      userId: user.id,
      likes: 15,
    },
    {
      title: 'Tips for First-Time Safari Goers',
      content: 'Planning your first safari? Here are my top 10 tips after experiencing the Masai Mara. From what to pack to the best times for wildlife viewing, this guide covers everything you need to know.',
      userId: guide.id,
      likes: 23,
    },
    {
      title: 'Hidden Gems in Paris',
      content: 'Everyone knows the Eiffel Tower and Louvre, but Paris has so much more to offer. Let me share some lesser-known spots that will make your Paris trip truly unique.',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      userId: admin.id,
      likes: 8,
    },
  ];

  console.log('Creating sample posts...');
  for (const postData of posts) {
    const existingPost = await prisma.post.findFirst({
      where: { title: postData.title },
    });

    if (!existingPost) {
      const post = await prisma.post.create({
        data: postData,
      });

      // Create some sample comments
      if (post.title.includes('Bali')) {
        await prisma.comment.createMany({
          data: [
            {
              postId: post.id,
              userId: guide.id,
              content: 'Great post! Bali is indeed magical. Which temple was your favorite?',
            },
            {
              postId: post.id,
              userId: admin.id,
              content: 'Thanks for sharing! Planning to visit next month.',
            },
          ],
        });
      }

      // Create some sample likes
      if (post.likes > 0) {
        const likeExists = await prisma.postLike.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: user.id === post.userId ? guide.id : user.id,
            },
          },
        });

        if (!likeExists) {
          await prisma.postLike.create({
            data: {
              postId: post.id,
              userId: user.id === post.userId ? guide.id : user.id,
            },
          });
        }
      }
    }
  }
  console.log('Sample posts, comments, and likes created');

  // Create sample tours
  const tourData = [
    {
      title: 'Amazing Bali Adventure',
      description: 'Experience the beauty of Bali with our 7-day adventure tour including temples, beaches, and rice terraces.',
      location: 'Bali, Indonesia',
      price: 1299.99,
      startDate: new Date('2025-06-01'), // Changed to future date
      endDate: new Date('2025-06-07'),
      capacity: 20,
      category: 'adventure',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
      guideId: guide.id,
    },
    {
      title: 'Paris City Tour',
      description: 'Discover the city of lights with our comprehensive 5-day Paris tour.',
      location: 'Paris, France',
      price: 1599.99,
      startDate: new Date('2025-07-15'), // Changed to future date
      endDate: new Date('2025-07-20'),
      capacity: 15,
      category: 'cultural',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      guideId: guide.id,
    },
    {
      title: 'Safari in Kenya',
      description: 'Wildlife adventure in the heart of Africa. See the Big Five in their natural habitat.',
      location: 'Masai Mara, Kenya',
      price: 2499.99,
      startDate: new Date('2025-08-10'), // Changed to future date
      endDate: new Date('2025-08-17'),
      capacity: 12,
      category: 'wildlife',
      imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801',
    },
    {
      title: 'Tokyo Food Tour',
      description: 'Culinary journey through Tokyo\'s best restaurants and street food markets.',
      location: 'Tokyo, Japan',
      price: 899.99,
      startDate: new Date('2025-09-01'), // Changed to future date
      endDate: new Date('2025-09-04'),
      capacity: 10,
      category: 'food',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    },
  ];

  // Create tours using create instead of upsert
  console.log('Creating sample tours...');
  for (const tour of tourData) {
    // Check if tour already exists
    const existingTour = await prisma.tour.findFirst({
      where: { title: tour.title },
    });

    if (!existingTour) {
      await prisma.tour.create({
        data: tour,
      });
      console.log(`Created tour: ${tour.title}`);
    } else {
      console.log(`Tour already exists: ${tour.title}`);
    }
  }

  // Create sample bookings
  const createdTours = await prisma.tour.findMany({
    take: 2,
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (createdTours.length > 0 && user) {
    // Check if booking already exists
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        tourId: createdTours[0].id,
      },
    });

    if (!existingBooking) {
      // Create a confirmed booking
      await prisma.booking.create({
        data: {
          userId: user.id,
          tourId: createdTours[0].id,
          amount: createdTours[0].price,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          specialRequests: 'Vegetarian meals please',
        },
      });
      console.log('Created confirmed booking');
    }

    // Create a pending booking
    if (createdTours.length > 1) {
      const existingPendingBooking = await prisma.booking.findFirst({
        where: {
          userId: user.id,
          tourId: createdTours[1].id,
        },
      });

      if (!existingPendingBooking) {
        await prisma.booking.create({
          data: {
            userId: user.id,
            tourId: createdTours[1].id,
            amount: createdTours[1].price,
            status: 'PENDING',
            paymentStatus: 'PENDING',
          },
        });
        console.log('Created pending booking');
      }
    }
  }

  // Create sample notifications
  const notifications = [
    {
      userId: user.id,
      type: 'BOOKING_CONFIRMED' as const,
      title: 'Booking Confirmed',
      content: 'Your booking for Amazing Bali Adventure has been confirmed!',
      isRead: false,
    },
    {
      userId: user.id,
      type: 'TOUR_REMINDER' as const,
      title: 'Tour Reminder',
      content: 'Your tour to Bali starts in 3 days. Get ready for an amazing adventure!',
      isRead: false,
    },
  ];

  console.log('Creating sample notifications...');
  for (const notification of notifications) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: notification.userId,
        title: notification.title,
      },
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: notification,
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log({
    users: { admin: admin.email, guide: guide.email, user: user.email },
    message: 'All sample data created successfully',
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });