"use client";

import { useEffect, useMemo, useState } from "react";
import "./globals.css";
import { getConcerts } from "@/services/concertService";

export default function Home() {
  const [activePage, setActivePage] = useState("home");

  // Concert data from MySQL
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Selected concert and ticket data
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [ticketTypesLoading, setTicketTypesLoading] = useState(false);
  const [ticketTypesError, setTicketTypesError] = useState("");
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // MySQL bookings
  const [bookings, setBookings] = useState([]);
  const [bookingCustomerId, setBookingCustomerId] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState("");

  // MongoDB reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewCustomerId, setReviewCustomerId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  // Fetch concerts
  useEffect(() => {
    async function loadConcerts() {
      try {
        setLoading(true);

        const data = await getConcerts();

        setConcerts(data);
        setError("");
      } catch (err) {
        console.error("Failed to load concerts:", err);
        setError("Unable to load concerts. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadConcerts();
  }, []);

  // Fetch ticket types when a concert is selected
  useEffect(() => {
    if (!selectedConcert) {
      setTicketTypes([]);
      setSelectedTicketTypeId("");
      setTicketTypesError("");
      return;
    }

    async function loadTicketTypes() {
      try {
        setTicketTypesLoading(true);
        setTicketTypesError("");
        setTicketTypes([]);
        setSelectedTicketTypeId("");

        const response = await fetch(
          `/api/ticket-types?concertId=${selectedConcert.id}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load ticket types."
          );
        }

        const types = result.data || [];

        setTicketTypes(types);

        const firstAvailable = types.find(
          (type) => Number(type.available_tickets) > 0
        );

        setSelectedTicketTypeId(
          firstAvailable ? String(firstAvailable.id) : ""
        );
      } catch (err) {
        console.error("Failed to load ticket types:", err);

        setTicketTypesError(
          err.message || "Unable to load ticket types."
        );
      } finally {
        setTicketTypesLoading(false);
      }
    }

    loadTicketTypes();
  }, [selectedConcert]);

  // Fetch MongoDB reviews when a concert is selected
  useEffect(() => {
    if (!selectedConcert) {
      setReviews([]);
      setReviewsError("");
      setReviewMessage("");
      return;
    }

    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await fetch(
          `/api/reviews?concertId=${selectedConcert.id}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load reviews."
          );
        }

        setReviews(result.data || []);
      } catch (err) {
        console.error("Failed to load reviews:", err);

        setReviewsError(
          err.message || "Unable to load reviews."
        );
      } finally {
        setReviewsLoading(false);
      }
    }

    loadReviews();
  }, [selectedConcert]);

  // Search concerts
  const filteredConcerts = useMemo(() => {
    return concerts.filter((concert) => {
      const searchText = [
        concert.name,
        concert.artist,
        concert.city,
        concert.venue,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(search.toLowerCase());
    });
  }, [concerts, search]);

  // Selected ticket type
  const selectedTicketType = ticketTypes.find(
    (type) => String(type.id) === selectedTicketTypeId
  );

  const availableTickets = selectedTicketType
    ? Number(selectedTicketType.available_tickets)
    : 0;

  const ticketPrice = selectedTicketType
    ? Number(selectedTicketType.price)
    : 0;

  // Create booking through the MySQL API
  async function createBooking() {
    const customerId = Number(bookingCustomerId);
    const requestedQuantity = Number(quantity);

    // Validate customer ID
    if (!Number.isInteger(customerId) || customerId <= 0) {
      setBookingMessage("Enter a valid customer ID.");
      setBookingMessageType("error");
      return;
    }

    // Validate concert and ticket selection
    if (!selectedConcert || !selectedTicketType) {
      setBookingMessage(
        "Please select a concert and ticket category."
      );
      setBookingMessageType("error");
      return;
    }

    // Validate quantity
    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > 6
    ) {
      setBookingMessage(
        "Select a quantity between 1 and 6."
      );
      setBookingMessageType("error");
      return;
    }

    // Check available inventory
    if (
      availableTickets < 1 ||
      requestedQuantity > availableTickets
    ) {
      setBookingMessage(
        `Only ${availableTickets} ticket(s) are currently available.`
      );
      setBookingMessageType("error");
      return;
    }

    try {
      setBookingSubmitting(true);
      setBookingMessage("");
      setBookingMessageType("");

      // Send booking request to the backend
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId,
          concertId: Number(selectedConcert.id),
          ticketTypeId: Number(selectedTicketType.id),
          quantity: requestedQuantity,
        }),
      });

      const result = await response.json();

      // Handle API errors
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to create booking."
        );
      }

      // Store the actual booking response in React state
      const newBooking = {
        id: result.bookingId,
        concert: selectedConcert.name,
        ticket: selectedTicketType.name,
        quantity: Number(result.quantity),
        total: Number(result.totalAmount),
        status: result.bookingStatus || "PENDING",
      };

      setBookings((previous) => [
        newBooking,
        ...previous,
      ]);

      setBookingMessage(
        `Booking #${result.bookingId} created successfully. Status: ${
          result.bookingStatus || "PENDING"
        }. Payment has not been processed.`
      );

      setBookingMessageType("success");

      setQuantity(1);

    } catch (err) {
      console.error("Failed to create booking:", err);

      setBookingMessage(
        err.message || "Unable to create booking. Please try again."
      );

      setBookingMessageType("error");

      return;
    } finally {
      setBookingSubmitting(false);
    }

    // Refresh ticket availability separately.
    // A refresh failure must not turn a successful booking
    // into an apparent booking failure.
    try {
      const ticketResponse = await fetch(
        `/api/ticket-types?concertId=${selectedConcert.id}`
      );

      const ticketResult = await ticketResponse.json();

      if (ticketResponse.ok && ticketResult.success) {
        const updatedTypes = ticketResult.data || [];

        setTicketTypes(updatedTypes);

        const updatedSelectedType = updatedTypes.find(
          (type) =>
            String(type.id) === String(selectedTicketType.id)
        );

        if (
          !updatedSelectedType ||
          Number(updatedSelectedType.available_tickets) < 1
        ) {
          setSelectedTicketTypeId("");
        }
      }
    } catch (err) {
      console.error(
        "Booking succeeded, but ticket availability refresh failed:",
        err
      );
    }
  }

  // Submit a review to MongoDB
  async function submitReview(event) {
    event.preventDefault();

    const customerId = Number(reviewCustomerId);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      setReviewMessage("Enter a valid customer ID.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage("Please enter a comment.");
      return;
    }

    try {
      setReviewSubmitting(true);
      setReviewMessage("");

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          concertId: selectedConcert.id,
          customerId,
          rating: Number(reviewRating),
          comment: reviewComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit review."
        );
      }

      setReviews((previous) => [
        result.data,
        ...previous,
      ]);

      setReviewComment("");
      setReviewRating(5);
      setReviewMessage("Review added successfully!");

    } catch (err) {
      console.error("Failed to submit review:", err);

      setReviewMessage(
        err.message || "Unable to submit review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  // Format date
  function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">C</span>

          <div>
            <strong>concertsphere</strong>
            <small>YOUR WORLD OF LIVE MUSIC</small>
          </div>
        </div>

        <p className="menu-label">MENU</p>

        <nav>
          <button onClick={() => setActivePage("home")}>
            ⌂ Overview
          </button>

          <button onClick={() => setActivePage("explore")}>
            ◉ Explore concerts
          </button>

          <button onClick={() => setActivePage("bookings")}>
            ▤ My bookings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <h4>Make it a night to remember.</h4>
          <p>Discover music. Find your people.</p>
          <small>CONCERTSPHERE · 2026</small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-area">

        <header className="topbar">
          <div>
            <p>Workspace / {activePage}</p>

            <h2>
              {activePage === "home"
                ? "Your concert dashboard"
                : activePage === "explore"
                  ? "Discover live music"
                  : "Your bookings"}
            </h2>
          </div>

          <div className="profile">C</div>
        </header>

        <div className="content">

          {/* HOME PAGE */}
          {activePage === "home" && (
            <>
              <section className="hero">
                <span>YOUR NEXT LIVE EXPERIENCE STARTS HERE</span>

                <h1>
                  Music brings us
                  <br />
                  together.
                </h1>

                <p>
                  Discover unforgettable live performances,
                  explore new artists and find your next
                  favourite concert.
                </p>

                <button onClick={() => setActivePage("explore")}>
                  Explore concerts ↗
                </button>
              </section>

              <section className="section-heading">
                <div>
                  <span>HANDPICKED FOR YOU</span>
                  <h2>Featured concerts</h2>
                  <p>Find the experience worth showing up for.</p>
                </div>
              </section>

              {loading ? (
                <p>Loading concerts...</p>
              ) : error ? (
                <p className="empty">{error}</p>
              ) : concerts.length === 0 ? (
                <p className="empty">
                  No concerts available.
                </p>
              ) : (
                <div className="concert-grid">
                  {concerts.slice(0, 3).map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      onSelect={setSelectedConcert}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* EXPLORE PAGE */}
          {activePage === "explore" && (
            <>
              <section className="section-heading">
                <div>
                  <span>FIND YOUR NEXT EXPERIENCE</span>
                  <h2>Explore concerts</h2>
                  <p>Discover artists, events and live music.</p>
                </div>
              </section>

              <input
                className="search"
                placeholder="Search concerts, artists or cities..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {loading ? (
                <p>Loading concerts...</p>
              ) : error ? (
                <p className="empty">{error}</p>
              ) : filteredConcerts.length === 0 ? (
                <p className="empty">
                  No concerts found. Try another search.
                </p>
              ) : (
                <div className="concert-grid">
                  {filteredConcerts.map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      onSelect={setSelectedConcert}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* BOOKINGS PAGE */}
          {activePage === "bookings" && (
            <>
              <section className="section-heading">
                <div>
                  <span>YOUR CONCERT ACTIVITY</span>
                  <h2>My bookings</h2>
                  <p>Your bookings from this session.</p>
                </div>
              </section>

              {bookings.length === 0 ? (
                <div className="empty">
                  <h3>No bookings yet.</h3>

                  <p>
                    Explore concerts and create your first booking.
                  </p>

                  <button onClick={() => setActivePage("explore")}>
                    Explore concerts
                  </button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div className="booking-card" key={booking.id}>
                    <h3>{booking.concert}</h3>

                    <p>
                      {booking.ticket} · {booking.quantity} ticket(s)
                    </p>

                    <strong>
                      ₹{booking.total.toLocaleString("en-IN")}
                    </strong>

                    <p>
                      Booking ID: {booking.id}
                    </p>

                    <p>
                      Booking status: {booking.status}
                    </p>

                    <p>
                      Payment not processed.
                    </p>
                  </div>
                ))
              )}
            </>
          )}

        </div>
      </main>

      {/* CONCERT DETAILS MODAL */}
      {selectedConcert && (
        <div className="modal-backdrop">

          <div className="modal">

            <button
              className="close"
              onClick={() => setSelectedConcert(null)}
            >
              ×
            </button>

            <span>CONCERT DETAILS</span>

            <h2>{selectedConcert.name}</h2>

            <p>{selectedConcert.artist}</p>

            <p>{formatDate(selectedConcert.date)}</p>

            <p>
              {selectedConcert.venue}, {selectedConcert.city}
            </p>

            {/* CUSTOMER ID */}
            <label htmlFor="booking-customer-id">
              Customer ID
            </label>

            <input
              id="booking-customer-id"
              type="number"
              min="1"
              value={bookingCustomerId}
              onChange={(event) =>
                setBookingCustomerId(event.target.value)
              }
              placeholder="Enter your existing customer ID"
            />

            {/* BOOKING MESSAGE */}
            {bookingMessage && (
              <p
                className={
                  bookingMessageType === "success"
                    ? "booking-success"
                    : "booking-error"
                }
                role="status"
              >
                {bookingMessage}
              </p>
            )}

            {/* TICKET CATEGORY */}
            <label>Ticket category</label>

            {ticketTypesLoading ? (
              <p>Loading ticket categories...</p>
            ) : ticketTypesError ? (
              <p className="empty">{ticketTypesError}</p>
            ) : ticketTypes.length === 0 ? (
              <p className="empty">
                No ticket categories are listed for this concert.
              </p>
            ) : (
              <>
                <select
                  value={selectedTicketTypeId}
                  onChange={(event) => {
                    setSelectedTicketTypeId(event.target.value);
                    setQuantity(1);
                    setBookingMessage("");
                    setBookingMessageType("");
                  }}
                >
                  <option value="">
                    Select a ticket category
                  </option>

                  {ticketTypes.map((type) => {
                    const available = Number(
                      type.available_tickets
                    );

                    return (
                      <option
                        key={type.id}
                        value={String(type.id)}
                        disabled={available < 1}
                      >
                        {type.name} — ₹
                        {Number(type.price).toLocaleString("en-IN")}

                        {available < 1
                          ? " (Sold out)"
                          : ` (${available} available)`}
                      </option>
                    );
                  })}
                </select>

                {selectedTicketType && (
                  <>
                    {selectedTicketType.description && (
                      <p>
                        {selectedTicketType.description}
                      </p>
                    )}

                    <p>
                      {availableTickets > 0
                        ? `${availableTickets} ticket(s) available`
                        : "This ticket category is sold out."}
                    </p>

                    <label>Quantity</label>

                    <input
                      type="number"
                      min="1"
                      max={Math.min(6, availableTickets)}
                      value={quantity}
                      disabled={availableTickets < 1}
                      onChange={(event) => {
                        const value = Number(event.target.value);

                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              6,
                              availableTickets,
                              value || 1
                            )
                          )
                        );
                      }}
                    />

                    <h3>
                      Total: ₹
                      {(ticketPrice * quantity).toLocaleString("en-IN")}
                    </h3>
                  </>
                )}
              </>
            )}

            {/* BOOKING BUTTON */}
            <button
              className="book-button"
              onClick={createBooking}
              disabled={
                ticketTypesLoading ||
                bookingSubmitting ||
                !selectedTicketType ||
                availableTickets < 1 ||
                quantity > availableTickets
              }
            >
              {bookingSubmitting
                ? "Creating booking..."
                : "Book tickets"}
            </button>

            <p className="disclaimer">
              Bookings are saved in the database.
              Payment is not processed yet.
            </p>

            {/* MONGODB REVIEWS */}
            <hr />

            <section className="reviews-section">
              <h3>Concert reviews</h3>

              {reviewsLoading ? (
                <p>Loading reviews...</p>
              ) : reviewsError ? (
                <p className="empty">{reviewsError}</p>
              ) : reviews.length === 0 ? (
                <p>
                  No reviews yet. Be the first to review this concert.
                </p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <article
                      className="review-card"
                      key={review._id}
                    >
                      <strong>
                        {"★".repeat(Number(review.rating))}
                        {"☆".repeat(
                          5 - Number(review.rating)
                        )}
                      </strong>

                      <p>{review.comment}</p>

                      <small>
                        Customer #{review.customerId} ·{" "}
                        {new Date(
                          review.createdAt
                        ).toLocaleDateString("en-IN")}
                      </small>
                    </article>
                  ))}
                </div>
              )}

              {/* REVIEW FORM */}
              <form
                onSubmit={submitReview}
                className="review-form"
              >
                <h4>Write a review</h4>

                <label htmlFor="review-customer-id">
                  Customer ID
                </label>

                <input
                  id="review-customer-id"
                  type="number"
                  min="1"
                  value={reviewCustomerId}
                  onChange={(event) =>
                    setReviewCustomerId(event.target.value)
                  }
                  required
                />

                <label htmlFor="review-rating">
                  Rating
                </label>

                <select
                  id="review-rating"
                  value={reviewRating}
                  onChange={(event) =>
                    setReviewRating(Number(event.target.value))
                  }
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>

                <label htmlFor="review-comment">
                  Comment
                </label>

                <textarea
                  id="review-comment"
                  rows={3}
                  maxLength={1000}
                  value={reviewComment}
                  onChange={(event) =>
                    setReviewComment(event.target.value)
                  }
                  placeholder="How was your concert experience?"
                  required
                />

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting
                    ? "Submitting..."
                    : "Submit review"}
                </button>

                {reviewMessage && (
                  <p>{reviewMessage}</p>
                )}
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// CONCERT CARD COMPONENT
function ConcertCard({ concert, onSelect }) {
  const formattedDate = concert.date
    ? new Date(concert.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  return (
    <article className="concert-card">

      <div className="concert-art purple">
        <span>LIVE CONCERT</span>
        <h2>{concert.name}</h2>
        <p>{concert.artist}</p>
      </div>

      <div className="card-content">
        <span className="date">{formattedDate}</span>

        <h3>{concert.name}</h3>

        <p>
          {concert.venue}, {concert.city}
        </p>

        <div className="card-footer">
          <strong>
            ₹{Number(concert.price || 0).toLocaleString("en-IN")}
          </strong>

          <button onClick={() => onSelect(concert)}>
            View details
          </button>
        </div>
      </div>
    </article>
  );
}