# ConcertSphere – Concert Management and Ticket Booking System

## About the Project

ConcertSphere is our DBMS mini project. We wanted to build a simple website where users can check out concerts, see the available ticket options and book tickets. The application also lets users share reviews for concerts they have attended.

While working on this project, we got to apply what we learned about database design and connect a web application to both MySQL and MongoDB.

## Team Members

1. **Ananya V** - PES1UG24CSO61
2. **Akanksha P** - PES1UG25CS801

## Features

- View the list of concerts along with details like date, venue and artist.
- Check the different ticket categories, their prices and ticket availability.
- Book tickets for a selected concert.
- Store booking details and update the status of booked tickets.
- Add and view reviews for concerts that have already taken place.
- Manage information about artists, venues, stages, performances, customers and sponsors.

## Technologies Used

| Area | Technology |
|---|---|
| Frontend | Next.js, React, JavaScript |
| Relational database | MySQL |
| NoSQL database | MongoDB |
| Database packages | `mysql2`, MongoDB Node.js driver |
| API | Next.js API routes |

## Project Structure

The Next.js application is present inside the `concertsphere` folder.

```text
Concert_Management/
├── concertsphere/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── bookings/
│   │   │   │   ├── concerts/
│   │   │   │   ├── reviews/
│   │   │   │   └── ticket-types/
│   │   │   ├── page.js
│   │   │   ├── layout.js
│   │   │   └── globals.css
│   │   ├── lib/
│   │   │   ├── mysql.js
│   │   │   └── mongodb.js
│   │   └── services/
│   └── ...
├── Mini_Project.sql
└── README.md
```

## Database Details

We have used two databases in this project, with each one handling a different type of data.

### MySQL – `ConcertManagement`

MySQL is used for the main application data. The `Mini_Project.sql` file creates the database, tables and sample records.

The tables include:

- `Artist` and `Venue`
- `Stage` and `Performance`
- `Concert` and `ConcertSponsor`
- `Sponsor`
- `TicketType` and `Ticket`
- `Customer`
- `Booking` and `BookingItem`
- `Payment`

Primary keys and foreign keys are used to connect the related tables.

### MongoDB – Concert Reviews

We use MongoDB to store concert reviews. A review contains details such as the concert ID, customer ID, rating, comment and date of submission.

Reviews are meant for concerts that have already been completed. Upcoming concerts should not have the option to submit a review.

## How to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/Aishu70/Concert_Management.git
cd Concert_Management
```

### 2. Set up MySQL

1. Open MySQL Workbench or any MySQL client.
2. Open the `Mini_Project.sql` file.
3. Run the SQL script. It creates the `ConcertManagement` database, all the required tables and the sample data.
4. Check that the tables and records have been created.

**Note:** The SQL file creates the database and tables. It is best to run it on a clean database. If you already have a populated copy, take a backup before resetting or running the script again.

### 3. Set up MongoDB

Make sure MongoDB is available and that you have a database ready to store the reviews. You will need its connection string for the next step.

### 4. Add the environment variables

Inside the `concertsphere` folder, create a file named `.env.local`.

Add your database details in the following format:

```env
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=ConcertManagement
MYSQL_PORT=3306

MONGODB_URI=your_mongodb_connection_string
MONGODB_DATABASE=your_mongodb_database_name
```

Replace the sample values with your own database credentials. Do not upload `.env.local` or share your database passwords on GitHub.

### 5. Install and start the application

Open a terminal inside the `concertsphere` folder and run:

```bash
npm install
npm run dev
```

After the development server starts, open the following address in your browser:

```text
http://localhost:3000
```

Make sure the database services are running and the connection details in `.env.local` are correct before testing the database-related features.

## Notes

- The ticket availability shown in the application depends on the ticket records in MySQL.
- When a booking is made, the booking details are stored and the selected tickets are updated.
- The current booking flow records bookings with a **PENDING** status. It does not mean that an online payment has been completed.
- Reviews are intended only for completed concerts, not upcoming ones.
- The SQL file includes sample records that can be used while exploring and testing the application.

