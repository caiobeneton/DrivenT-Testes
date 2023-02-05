import { AuthenticatedRequest } from "@/middlewares";
import hotelsService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const hotels = await hotelsService.getHotel(userId);
    return res.send(hotels).status(httpStatus.OK);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }

    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function getHotelRooms(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { hotelId } = req.params;

  try {
    const rooms = await hotelsService.getHotelRooms(userId, Number(hotelId));
    return res.send(rooms).status(httpStatus.OK);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.status(httpStatus.NOT_FOUND).send(error.message);
    }

    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
