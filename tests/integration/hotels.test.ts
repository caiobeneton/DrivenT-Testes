import { TicketStatus } from "@prisma/client";
import app, { init } from "@/app";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import httpStatus from "http-status";
import faker from "@faker-js/faker";
import * as jwt from "jsonwebtoken";
import { createUser, createEnrollmentWithAddress, createTicket, createTicketType, createHotel, createRoom } from "../factories";

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when user has no ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 when ticketType does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = false;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticketType is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = true;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticket is not paid yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 200 and hotels data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);

      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
        },
      ]);
    });
  });
});

describe("GET /hotels/:hotelId", () => {
  it("should respond with status 401 if no Authorization header is given", async () => {
    const response = await server.get("/hotels/:hotelId");
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    const response = await server.get("/hotels/:hotelId").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get("/hotels/:hotelId").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when user has no ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 when ticketType does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = false;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticketType is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = true;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 when ticket is not paid yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 404 when there is no existing hotelId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels/0").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 & rooms data from hotelId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const isRemote = false;
      const includesHotel = true;
      const ticketType = await createTicketType(isRemote, includesHotel);

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();
      const hotelWithRooms = await createRoom(hotel.id);

      const response = await server.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);

      expect(response.body).toEqual({
        id: hotel.id,
        name: hotel.name,
        image: hotel.image,
        createdAt: hotel.createdAt.toISOString(),
        updatedAt: hotel.updatedAt.toISOString(),
        Rooms: [
          {
            id: hotelWithRooms.Rooms[0].id,
            name: hotelWithRooms.Rooms[0].name,
            capacity: hotelWithRooms.Rooms[0].capacity,
            hotelId: hotelWithRooms.Rooms[0].hotelId,
            createdAt: hotelWithRooms.Rooms[0].createdAt.toISOString(),
            updatedAt: hotelWithRooms.Rooms[0].updatedAt.toISOString(),
          },
        ],
      });
    });
  });
});
