import unittest
from api.services.recommendation import rank_routes
from api.services.corridor import generate_corridor_heatmap_matrix


class RecommendationTestCase(unittest.TestCase):
    def test_criterion_1_fewest_severe_miles_beats_travel_time(self):
        # Route A: 0 severe miles, 18 hours (64,800s)
        route_a = {
            "id": "route_safe_long",
            "name": "Route A (Safe but Longer)",
            "total_duration_seconds": 64800,
            "average_risk_score": 1.2,
            "risk_summary": {
                "low_miles": 900.0,
                "moderate_miles": 100.0,
                "high_miles": 0.0,
                "severe_miles": 0.0,
                "no_travel_miles": 0.0,
            },
        }

        # Route B: 25 severe miles, 12 hours (43,200s) - 6 hours faster!
        route_b = {
            "id": "route_risky_fast",
            "name": "Route B (Fast but Risky)",
            "total_duration_seconds": 43200,
            "average_risk_score": 2.4,
            "risk_summary": {
                "low_miles": 700.0,
                "moderate_miles": 100.0,
                "high_miles": 50.0,
                "severe_miles": 25.0,
                "no_travel_miles": 0.0,
            },
        }

        rec_id, reason, ranked = rank_routes([route_b, route_a])

        # Route A MUST be recommended
        self.assertEqual(rec_id, "route_safe_long")
        self.assertTrue(ranked[0]["is_recommended"])
        self.assertFalse(ranked[1]["is_recommended"])
        self.assertIn("Severe", reason)

    def test_criterion_2_fewest_high_miles(self):
        # Both have 0 severe miles, but Route A has fewer high miles
        route_a = {
            "id": "route_a",
            "total_duration_seconds": 50000,
            "average_risk_score": 1.3,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 5.0},
        }
        route_b = {
            "id": "route_b",
            "total_duration_seconds": 48000,
            "average_risk_score": 1.7,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 35.0},
        }

        rec_id, _, _ = rank_routes([route_b, route_a])
        self.assertEqual(rec_id, "route_a")

    def test_criterion_3_lowest_average_risk(self):
        # Tied on severe (0) and high (0), but Route A has lower avg risk
        route_a = {
            "id": "route_a",
            "total_duration_seconds": 50000,
            "average_risk_score": 1.15,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 0.0},
        }
        route_b = {
            "id": "route_b",
            "total_duration_seconds": 48000,
            "average_risk_score": 1.85,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 0.0},
        }

        rec_id, _, _ = rank_routes([route_b, route_a])
        self.assertEqual(rec_id, "route_a")

    def test_criterion_4_shortest_time_tie_breaker(self):
        # Identical risk profiles -> Shortest duration wins
        route_a = {
            "id": "route_faster",
            "total_duration_seconds": 40000,
            "average_risk_score": 1.2,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 0.0},
        }
        route_b = {
            "id": "route_slower",
            "total_duration_seconds": 50000,
            "average_risk_score": 1.2,
            "risk_summary": {"severe_miles": 0.0, "no_travel_miles": 0.0, "high_miles": 0.0},
        }

        rec_id, _, _ = rank_routes([route_b, route_a])
        self.assertEqual(rec_id, "route_faster")

    def test_corridor_heatmap_matrix_structure(self):
        mock_forecasts = [{
            "latitude": 41.85,
            "longitude": -87.65,
            "hourly": {
                "time": [f"2026-10-24T{h:02d}:00" for h in range(48)],
                "wind_speed_10m": [15.0] * 48,
                "rain": [0.0] * 48,
                "snowfall": [0.0] * 48,
            },
        }]

        frames = generate_corridor_heatmap_matrix(mock_forecasts, load_weight_lbs=35000)

        # Must have exactly 48 frames
        self.assertEqual(len(frames), 48)

        # Check frame 0 structure
        self.assertEqual(len(frames[0]), 1)
        lat, lon, intensity = frames[0][0]
        self.assertAlmostEqual(lat, 41.85, places=2)
        self.assertAlmostEqual(lon, -87.65, places=2)
        self.assertTrue(0.0 <= intensity <= 1.0)


if __name__ == "__main__":
    unittest.main()
