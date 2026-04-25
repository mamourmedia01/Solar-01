"""
Financial ROI engine for solar installations.
"""
from app.models.lead import ROIData


UK_AVG_SUN_HOURS = 1100.0        # kWh/kWp/year
PANEL_EFFICIENCY_KW_PER_M2 = 0.15
INSTALL_COST_PER_KW = 1000.0     # £/kW installed
DEFAULT_ELECTRICITY_RATE = 0.28  # £/kWh (UK commercial avg)
DEFAULT_EXPORT_RATE = 0.15       # £/kWh Smart Export Guarantee
DEFAULT_EXPORT_FRACTION = 0.5    # 50% exported


def calculate_roi(
    roof_area_m2: float,
    electricity_rate: float = DEFAULT_ELECTRICITY_RATE,
    export_rate: float = DEFAULT_EXPORT_RATE,
    export_fraction: float = DEFAULT_EXPORT_FRACTION,
    install_cost_per_kw: float = INSTALL_COST_PER_KW,
    sun_hours: float = UK_AVG_SUN_HOURS,
) -> ROIData:
    system_kw = roof_area_m2 * PANEL_EFFICIENCY_KW_PER_M2
    annual_output_kwh = system_kw * sun_hours

    self_consumed = annual_output_kwh * (1 - export_fraction)
    exported = annual_output_kwh * export_fraction

    savings_year_1 = (self_consumed * electricity_rate) + (exported * export_rate)
    install_cost = system_kw * install_cost_per_kw

    payback_years = install_cost / savings_year_1 if savings_year_1 > 0 else 0
    savings_25yr = (savings_year_1 * 25) - install_cost

    return ROIData(
        system_kw=round(system_kw, 1),
        annual_output_kwh=round(annual_output_kwh, 0),
        savings_year_1=round(savings_year_1, 2),
        savings_25yr=round(savings_25yr, 2),
        install_cost=round(install_cost, 2),
        payback_years=round(payback_years, 1),
        electricity_rate=electricity_rate,
        export_rate=export_rate,
        export_fraction=export_fraction,
        sun_hours_per_year=sun_hours,
    )
