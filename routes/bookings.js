const express = require("express");
const router = express.Router();
const Booking = require("../model/Booking");

// Get available time slots for a specific date
router.get("/availability", async (req, res) => {
  const { date } = req.query;

  try {
    // Convert the requested date to start of day
    const requestedDate = new Date(date);
    requestedDate.setUTCHours(0, 0, 0, 0);

    // Get all bookings for the specific date only
    const bookings = await Booking.find({
      date: {
        $gte: requestedDate,
        $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Generate time slots (restaurant hours: 11 AM to 10 PM)
    const allTimeSlots = [];
    for (let hour = 11; hour <= 22; hour++) {
      allTimeSlots.push(`${hour}:00`);
      if (hour !== 22) allTimeSlots.push(`${hour}:30`);
    }

    // Filter out booked slots for the specific date
    const bookedTimes = bookings.map((booking) => booking.time);
    const availableSlots = allTimeSlots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    res.json({ availableSlots });
  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({ error: "Error checking availability" });
  }
});

// Create new booking
router.post("/bookings", async (req, res) => {
  try {
    // Convert the requested date to start of day for comparison
    const bookingDate = new Date(req.body.date);
    bookingDate.setUTCHours(0, 0, 0, 0);

    // Check if slot is already booked for the specific date
    const existingBooking = await Booking.findOne({
      date: {
        $gte: bookingDate,
        $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000),
      },
      time: req.body.time,
    });

    if (existingBooking) {
      return res.status(400).json({
        error: "This time slot is already booked for the selected date",
      });
    }

    // Create new booking
    const booking = new Booking({
      ...req.body,
      date: bookingDate, // Store the normalized date
    });
    await booking.save();
    res.status(201).json({ message: "Booking confirmed", booking });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
});

// Get all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1, time: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
});

// Get single booking by ID
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Error fetching booking" });
  }
});

// Delete booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully", booking });
  } catch (error) {
    res.status(500).json({ error: "Error deleting booking" });
  }
});

module.exports = router;
