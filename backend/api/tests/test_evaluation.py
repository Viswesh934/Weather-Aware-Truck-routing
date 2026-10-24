import unittest
from api.services.evaluation import calculate_route_risk_mileage, evaluate_routes_weather_risk


class EvaluationTestCase(unittest.TestCase):
    def test_risk_mileage_sum_equals_total_distance(self):
        checkpoints = [
            {"distance_from_origin_miles": 0.0, "risk": {"level": "Low", "score": 1}},
            {"distance_from_origin_miles": 25.0, "risk": {"level": "Moderate", "score": 2}},
            {"distance_from_origin_miles": 50.0, "risk": {"level": "High", "score": 3}},
            {"distance_from_origin_miles": 75.0, "risk": {"level": "Severe", "score": 4}},
            {"distance_from_origin_miles": 100.0, "risk": {"level": "No Travel", "score": 5}},
        ]
        total_dist = 100.0
        summary, avg_score = calculate_route_risk_mileage(checkpoints, total_dist)

        total_risk_miles = (
            summary["low_miles"]
            + summary["moderate_miles"]
            + summary["high_miles"]
            + summary["severe_miles"]
            + summary["no_travel_miles"]
        )
        self.assertAlmostEqual(total_risk_miles, total_dist, delta=0.5)
        self.assertEqual(avg_score, 3.0)

    def test_evaluate_routes_weather_and_load_override(self):
        # Route across 100 miles
        raw_routes = [{
            "id": "test_route_1",
            "name": "Test Corridor",
            "total_distance_miles": 100.0,
            "total_duration_minutes": 120,
            "total_duration_seconds": 7200,
            "geometry": {
                "type": "LineString",
                "coordinates": [(-87.0, 40.0), (-88.0, 40.0), (-89.0, 40.0)],
            },
        }]

        # Mock weather with high winds (48 mph) across hours
        prefetched_weather = [{
            "latitude": 40.0,
            "longitude": -87.0,
            "hourly": {
                "time": [f"2026-10-24T{h:02d}:00" for h in range(48)],
                "wind_speed_10m": [48.0] * 48,  # 48 mph wind
                "rain": [0.0] * 48,
                "snowfall": [0.0] * 48,
                "temperature_2m": [45.0] * 48,
            },
        }]

        # Case A: Light load (25,000 lbs) with 48 mph wind -> Severe (standard threshold)
        routes_light, _ = evaluate_routes_weather_risk(
            raw_routes=raw_routes,
            departure_time_iso="2026-10-24T08:00:00Z",
            load_weight_lbs=25000.0,
            sampling_interval_miles=25.0,
            prefetched_weather=prefetched_weather,
        )
        cp0_light = routes_light[0]["checkpoints"][0]
        self.assertEqual(cp0_light["risk"]["level"], "Severe")
        self.assertFalse(cp0_light["risk"]["load_override_applied"])

        # Case B: Heavy load (35,000 lbs) with 48 mph wind -> Escalates to No Travel (>30k lbs rule)
        routes_heavy, _ = evaluate_routes_weather_risk(
            raw_routes=raw_routes,
            departure_time_iso="2026-10-24T08:00:00Z",
            load_weight_lbs=35000.0,
            sampling_interval_miles=25.0,
            prefetched_weather=prefetched_weather,
        )
        cp0_heavy = routes_heavy[0]["checkpoints"][0]
        self.assertEqual(cp0_heavy["risk"]["level"], "No Travel")
        self.assertTrue(cp0_heavy["risk"]["load_override_applied"])
        self.assertGreater(routes_heavy[0]["risk_summary"]["no_travel_miles"], 0)

        # Segments count equals checkpoints count - 1
        self.assertEqual(len(routes_heavy[0]["segments"]), len(routes_heavy[0]["checkpoints"]) - 1)


if __name__ == "__main__":
    unittest.main()
