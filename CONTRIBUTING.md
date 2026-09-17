# Contributing to SmartTrip AI

Welcome to the SmartTrip AI project! We are thrilled that you are interested in contributing. SmartTrip AI is a next-generation door-to-door travel assistant that combines multi-modal routing, dynamic pricing strategies, and an advanced AI conversational agent.

This document outlines the architecture of the project, how to set up your local development environment, and our development workflow.

---

## Project Overview

The SmartTrip AI workspace consists of two main components:

1. **`smarttrip/` (Backend)**: A robust Python FastAPI server.
2. **`uber-clone/` (Frontend)**: A React Native (Expo) mobile application (internally known as Ryde) which has been extended to include SmartTrip AI agent features.

### 1. Backend (`smarttrip/`)
Located in the `smarttrip/` directory, the backend provides the core logic, API endpoints, and AI integrations:
- **Multi-Modal Search (`/api/v1/search`)**: Integrates simulated flights and PostGIS-based feeder routing.
- **Pricing Engine**: Handles Cross-Subsidy, Bundle Pricing, and SmartTrip Plus memberships.
- **AI Agent**: Built with `gemini-2.0-flash` and function calling to allow users to search and book trips using natural language.
- **Machine Learning**: Predicts demand and ETA using simulated scikit-learn models.
- **Real-Time Tracking**: WebSockets (`/ws/track/{journey_id}`) to track rides, with a built-in Python driver simulator.
- **Infrastructure**: Uses Docker Compose to spin up PostGIS and Redis.

### 2. Frontend (`uber-clone/`)
Located in the `uber-clone/` directory, the frontend is a cross-platform mobile app built with React Native and Expo:
- **Authentication**: Powered by Clerk.
- **Mapping & Routing**: Integrates Google Maps APIs for real-time location tracking and route suggestions.
- **Payments**: Uses Stripe for secure and seamless payments.
- **Database**: Relies on NeonDB for managing user, driver, and ride data.
- **SmartTrip Agent UI**: Custom views (`app/(root)/smarttrip/agent.tsx` and `search.tsx`) to interact with the backend AI agent.

---

## Local Setup & Installation

### Prerequisites
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (for the frontend)
- [Python 3.10+](https://www.python.org/) (for the backend)
- [Docker & Docker Compose](https://www.docker.com/) (for PostGIS and Redis)

### Setting up the Backend
1. Navigate to the backend directory:
   ```bash
   cd smarttrip
   ```
2. Run the orchestrator script to spin up the infrastructure and server:
   ```bash
   ./run_demo.sh
   ```
   *Note: Ensure you have your environment variables set correctly in `smarttrip/backend/.env` (e.g., API keys for Gemini, Redis URL, DB credentials).*

3. **Testing Real-Time Tracking**:
   In a new terminal window, activate the virtual environment and run the driver simulator:
   ```bash
   cd smarttrip/backend
   source venv/bin/activate
   export PYTHONPATH=.
   python app/scripts/driver_simulator.py
   ```

### Setting up the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd uber-clone
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the required API keys:
   - `CLERK_SECRET_KEY`
   - `PLACES_API_KEY`, `DIRECTION_API_KEY`, `GEOAPIFY_API_KEY`
   - `DATABASE_URL` (NeonDB)
   - `STRIPE_SECRET_KEY`
4. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## How to Contribute

1. **Fork and Clone**: Fork the repository on GitHub and clone it locally.
2. **Branching**: Create a feature branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Coding Standards**:
   - For Python: We use standard PEP 8 formatting. Please ensure your code is clean and typed where applicable.
   - For TypeScript/React Native: We use ESLint and Prettier. Keep components small, reusable, and appropriately styled using TailwindCSS.
4. **Committing**: Write clear, concise commit messages. (e.g., `feat: integrate new AI routing model`, `fix: resolve websocket connection drop`).
5. **Pull Requests**: Submit a PR against the `main` branch. Provide a detailed description of your changes, what issue they resolve, and instructions for testing.

### Key Areas for Contribution
- **AI Agent Enhancements**: Improving the natural language understanding of the Gemini agent in `cli_agent.py` or the frontend integration.
- **Pricing Optimization**: Enhancing the ML models for demand and ETA predictions.
- **UI/UX**: Polishing the React Native app screens, specifically the SmartTrip booking flows.

## Need Help?
If you get stuck or have questions about the architecture, feel free to open an issue or reach out to the core maintainers.

Happy coding! 🚀
