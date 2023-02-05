import { notFoundError, requestError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelsRepository from "@/repositories/hotels-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function checkEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket) {
    throw notFoundError();
  }

  if (!ticket.TicketType.includesHotel || ticket.TicketType.isRemote || ticket.status !== "PAID") {
    throw requestError(402, "Payment required");
  }
}

async function getHotel(userId: number) {
  await checkEnrollment(userId);

  return await hotelsRepository.findHotels();
}

async function getHotelRooms(userId: number, hotelId: number) {
  await checkEnrollment(userId);

  const rooms = await hotelsRepository.findHotelRooms(hotelId);

  if (!rooms) {
    throw notFoundError();
  }

  return rooms;
}

const hotelsService = {
  getHotel,
  getHotelRooms
};

export default hotelsService;
