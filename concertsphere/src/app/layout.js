export const metadata = {
  title: "ConcertSphere | Discover Live Music",
  description:
    "Explore concerts, discover artists and manage your ticket bookings with ConcertSphere.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}