import unittest
from api.services.risk_engine import (
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
    RiskScore,
)


class RiskEngineTestCase(unittest.TestCase):
    def test_wind_classification(self):
        self.assertEqual(classify_wind(24.9), RiskScore.LOW)
        self.assertEqual(classify_wind(25.0), RiskScore.MODERATE)
        self.assertEqual(classify_wind(34.9), RiskScore.MODERATE)
        self.assertEqual(classify_wind(35.0), RiskScore.HIGH)
        self.assertEqual(classify_wind(44.9), RiskScore.HIGH)
        self.assertEqual(classify_wind(45.0), RiskScore.SEVERE)
        self.assertEqual(classify_wind(54.9), RiskScore.SEVERE)
        self.assertEqual(classify_wind(55.0), RiskScore.NO_TRAVEL)
        self.assertEqual(classify_wind(70.0), RiskScore.NO_TRAVEL)

    def test_rain_classification(self):
        self.assertEqual(classify_rain(0.05), RiskScore.LOW)
        self.assertEqual(classify_rain(0.10), RiskScore.MODERATE)
        self.assertEqual(classify_rain(0.24), RiskScore.MODERATE)
        self.assertEqual(classify_rain(0.25), RiskScore.HIGH)
        self.assertEqual(classify_rain(0.49), RiskScore.HIGH)
        self.assertEqual(classify_rain(0.50), RiskScore.SEVERE)
        self.assertEqual(classify_rain(1.00), RiskScore.SEVERE)
        self.assertEqual(classify_rain(1.01), RiskScore.NO_TRAVEL)

    def test_snow_classification(self):
        self.assertEqual(classify_snow(0.4), RiskScore.LOW)
        self.assertEqual(classify_snow(0.5), RiskScore.MODERATE)
        self.assertEqual(classify_snow(0.99), RiskScore.MODERATE)
        self.assertEqual(classify_snow(1.0), RiskScore.HIGH)
        self.assertEqual(classify_snow(1.99), RiskScore.HIGH)
        self.assertEqual(classify_snow(2.0), RiskScore.SEVERE)
        self.assertEqual(classify_snow(3.0), RiskScore.SEVERE)
        self.assertEqual(classify_snow(3.05), RiskScore.NO_TRAVEL)

    def test_load_rule_extreme_wind_any_load(self):
        # >= 55 mph -> No Travel for any load
        res_empty = evaluate_checkpoint_risk(wind_mph=56.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=0)
        self.assertEqual(res_empty["level"], "No Travel")
        self.assertEqual(res_empty["score"], 5)

        res_heavy = evaluate_checkpoint_risk(wind_mph=55.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=75000)
        self.assertEqual(res_heavy["level"], "No Travel")
        self.assertEqual(res_heavy["score"], 5)

    def test_load_rule_45_to_54_over_30k_lbs(self):
        # 45-54 mph + <= 30k lb -> Severe (standard threshold)
        res_light = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=25000)
        self.assertEqual(res_light["level"], "Severe")
        self.assertEqual(res_light["score"], 4)
        self.assertFalse(res_light["load_override_applied"])

        # 45-54 mph + > 30k lb -> Escalates to No Travel
        res_heavy = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=32000)
        self.assertEqual(res_heavy["level"], "No Travel")
        self.assertEqual(res_heavy["score"], 5)
        self.assertTrue(res_heavy["load_override_applied"])
        self.assertIn("30,000 lb", res_heavy["load_rule_description"])

    def test_load_rule_35_to_44_over_40k_lbs(self):
        # 35-44 mph + <= 40k lb -> High (standard threshold)
        res_mid = evaluate_checkpoint_risk(wind_mph=40.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=35000)
        self.assertEqual(res_mid["level"], "High")
        self.assertEqual(res_mid["score"], 3)
        self.assertFalse(res_mid["load_override_applied"])

        # 35-44 mph + > 40k lb -> Escalates to Severe
        res_heavy = evaluate_checkpoint_risk(wind_mph=40.0, rain_in_hr=0, snow_in_hr=0, load_weight_lbs=42000)
        self.assertEqual(res_heavy["level"], "Severe")
        self.assertEqual(res_heavy["score"], 4)
        self.assertTrue(res_heavy["load_override_applied"])
        self.assertIn("40,000 lb", res_heavy["load_rule_description"])

    def test_combined_multi_hazard(self):
        # Low wind (10 mph), but Severe rain (0.75 in/hr) -> Overall Severe
        res = evaluate_checkpoint_risk(wind_mph=10.0, rain_in_hr=0.75, snow_in_hr=0.0, load_weight_lbs=50000)
        self.assertEqual(res["level"], "Severe")
        self.assertEqual(res["score"], 4)
        self.assertIn("Rain", res["limiting_factors"])


if __name__ == "__main__":
    unittest.main()
