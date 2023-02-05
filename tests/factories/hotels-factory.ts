import faker from "@faker-js/faker";
import { prisma } from "@/config";

export async function createHotel() {
  return await prisma.hotel.create({
    data: {
      name: faker.commerce.productName(),
      image: faker.image.imageUrl(),
      updatedAt: new Date()
    }
  });
}

export async function createRoom(hotelId: number) {
  await prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number(),
      hotelId,
      updatedAt: new Date()
    }
  });

  return await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      Rooms: true,
    },
  });
}
