import unittest
import datetime
from api.services.sampling import haversine_miles, sample_route_checkpoints


class SamplingTestCase(unittest.TestCase):
    def test_haversine_same_point(self):
        d = haversine_miles((-87.6298, 41.8781), (-87.6298, 41.8781))
        self.assertAlmostEqual(d, 0.0, places=4)

    def test_haversine_known_distance(self):
        # NYC (-74.006, 40.7128) to Philadelphia (-75.1652, 39.9526) ~ 80.5 miles
        nyc = (-74.006, 40.7128)
        philly = (-75.1652, 39.9526)
        d = haversine_miles(nyc, philly)
        self.assertTrue(78.0 <= d <= 84.0, f"Expected ~80 miles, got {d}")

    def test_sampling_empty_or_single_coord(self):
        self.assertEqual(sample_route_checkpoints([], 3600, "2026-10-24T08:00:00Z"), [])
        self.assertEqual(sample_route_checkpoints([(-87.6, 41.8)], 3600, "2026-10-24T08:00:00Z"), [])

    def test_sampling_checkpoints_monotonic_and_intervals(self):
        # A simple straight-line path across ~100 miles
        # Each degree of longitude at ~40 lat is ~53 miles
        coords = [(-87.0, 40.0), (-88.0, 40.0), (-89.0, 40.0)]
        total_duration_sec = 7200  # 2 hours
        dep_time = "2026-10-24T08:00:00Z"
        interval = 25.0

        checkpoints = sample_route_checkpoints(
            coordinates=coords,
            total_duration_seconds=total_duration_sec,
            departure_time_iso=dep_time,
            interval_miles=interval,
        )

        self.assertGreaterEqual(len(checkpoints), 4)

        # First checkpoint is origin at 0.0 miles
        self.assertEqual(checkpoints[0]["distance_from_origin_miles"], 0.0)
        self.assertEqual(checkpoints[0]["coordinates"], [-87.0, 40.0])

        # Verify distance increments and monotonic ETA
        for i in range(len(checkpoints) - 1):
            curr_cp = checkpoints[i]
            next_cp = checkpoints[i + 1]

            # Distances strictly increase
            self.assertGreater(next_cp["distance_from_origin_miles"], curr_cp["distance_from_origin_miles"])

            # ETAs strictly increase
            self.assertGreater(next_cp["eta_dt"], curr_cp["eta_dt"])

        # Check terminal checkpoint
        last_cp = checkpoints[-1]
        self.assertEqual(last_cp["coordinates"], [-89.0, 40.0])
        expected_dest_eta = datetime.datetime(2026, 10, 24, 10, 0, tzinfo=datetime.timezone.utc)
        self.assertEqual(last_cp["eta_dt"], expected_dest_eta)

    def test_sampling_different_intervals(self):
        # Chicago to Milwaukee ~ 90 miles
        coords = [(-87.6298, 41.8781), (-87.7, 42.4), (-87.9065, 43.0389)]
        duration_sec = 5400  # 1.5 hrs
        dep_time = "2026-10-24T12:00:00Z"

        cps_10 = sample_route_checkpoints(coords, duration_sec, dep_time, interval_miles=10.0)
        cps_25 = sample_route_checkpoints(coords, duration_sec, dep_time, interval_miles=25.0)
        cps_50 = sample_route_checkpoints(coords, duration_sec, dep_time, interval_miles=50.0)

        # Shorter intervals must produce more checkpoints
        self.assertGreater(len(cps_10), len(cps_25))
        self.assertGreater(len(cps_25), len(cps_50))


if __name__ == "__main__":
    unittest.main()
