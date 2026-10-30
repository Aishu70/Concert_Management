"use client";

import { useEffect, useMemo, useState } from "react";
import "./globals.css";
import { getConcerts } from "@/services/concertService";

export default function Home() {
  const [activePage, setActivePage] = useState("home");

  // Concert data from MySQL API
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Selected concert and demo booking details
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [ticket, setTicket] = useState("Gold");
  const [quantity, setQuantity] = useState(1);
  const [bookings, setBookings] = useState([]);

  // Demo ticket prices (will be replaced with database ticket types later)
  const ticketPrices = {
    Silver: 799,
    Gold: 1499,
    VIP: 2499,
  };

  // Fetch concerts from MySQL through the API
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

  // Search and filter concerts
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

  // Create a demo booking
  function createBooking() {
    if (!selectedConcert) return;

    const booking = {
      id: Date.now(),
      concert: selectedConcert.name,
      ticket,
      quantity,
      total: ticketPrices[ticket] * quantity,
    };

    setBookings((previous) => [booking, ...previous]);

    setSelectedConcert(null);
    setQuantity(1);
    setActivePage("bookings");
  }

  // Format concert date
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

        {/* TOPBAR */}
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
                <p className="empty">No concerts available.</p>
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

              {/* SEARCH */}
              <input
                className="search"
                placeholder="Search concerts, artists or cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {/* CONCERT LIST */}
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
                  <p>Your demo booking history.</p>
                </div>

              </section>

              {bookings.length === 0 ? (

                <div className="empty">

                  <h3>No bookings yet.</h3>

                  <p>
                    Explore concerts and create your first demo booking.
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
                      Demo booking — not saved to database yet.
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

            <label>Ticket category</label>

            <select
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
            >
              <option value="Silver">Silver — ₹799</option>
              <option value="Gold">Gold — ₹1,499</option>
              <option value="VIP">VIP — ₹2,499</option>
            </select>

            <label>Quantity</label>

            <input
              type="number"
              min="1"
              max="6"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(6, Number(e.target.value) || 1))
                )
              }
            />

            <h3>
              Total: ₹
              {(ticketPrices[ticket] * quantity).toLocaleString("en-IN")}
            </h3>

            <button className="book-button" onClick={createBooking}>
              Create demo booking
            </button>

            <p className="disclaimer">
              Demo only. No real ticket is reserved or payment processed.
            </p>

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