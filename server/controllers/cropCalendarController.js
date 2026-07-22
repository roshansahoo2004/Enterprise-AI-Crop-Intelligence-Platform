/**
 * GET /api/crop-calendar/schedule?crop=Rice
 */
const getCropSchedule = async (req, res) => {
  try {
    const cropName = (req.query.crop || 'Rice').toLowerCase().trim();

    const schedules = {
      rice: [
        { phase: 'Phase 1: Seedbed Preparation', duration: 'Days 1 - 15', action: 'Nursery preparation, seed soaking in bio-fungicide, land leveling', status: 'Completed', icon: '🌱' },
        { phase: 'Phase 2: Transplanting / Sowing', duration: 'Days 16 - 30', action: 'Main field flooding (2-3cm depth), seedling transplanting, NPK basal dose', status: 'Active', icon: '🌾' },
        { phase: 'Phase 3: Vegetative Growth & Tillering', duration: 'Days 31 - 60', action: 'Apply Urea top dressing (45 kg/ha), weed control, soil moisture monitoring', status: 'Upcoming', icon: '🌿' },
        { phase: 'Phase 4: Flowering & Panicle Initiation', duration: 'Days 61 - 90', action: 'Maintain continuous water layer, leaf blast disease inspection, Potash spray', status: 'Upcoming', icon: '🌸' },
        { phase: 'Phase 5: Grain Filling & Maturity', duration: 'Days 91 - 120', action: 'Field drainage 10 days before harvest, yield estimation check', status: 'Upcoming', icon: '🌽' },
        { phase: 'Phase 6: Harvesting & Storage', duration: 'Days 121 - 135', action: 'Mechanical harvesting, moisture reduction to 14%, grain storage in dry silo', status: 'Upcoming', icon: '🚜' }
      ],
      maize: [
        { phase: 'Phase 1: Soil Tillage & Basal Fertilizer', duration: 'Days 1 - 10', action: 'Deep plowing, basal NPK application, soil pH check', status: 'Completed', icon: '🚜' },
        { phase: 'Phase 2: Precision Sowing', duration: 'Days 11 - 20', action: 'Seed treatment with Trichoderma, 60cm row spacing sowing', status: 'Active', icon: '🌱' },
        { phase: 'Phase 3: Knee-High Stage Growth', duration: 'Days 21 - 45', action: 'Nitrogen top dressing, Fall Armyworm inspection, drip irrigation', status: 'Upcoming', icon: '🌿' },
        { phase: 'Phase 4: Tasseling & Silking', duration: 'Days 46 - 75', action: 'Peak moisture requirement stage, apply Potassium booster', status: 'Upcoming', icon: '🌸' },
        { phase: 'Phase 5: Grain Cob Maturity & Harvest', duration: 'Days 76 - 110', action: 'Cob husk drying check, mechanical harvesting', status: 'Upcoming', icon: '🌽' }
      ]
    };

    const schedule = schedules[cropName] || schedules.rice;

    res.json({
      success: true,
      cropName: cropName.charAt(0).toUpperCase() + cropName.slice(1),
      data: schedule
    });
  } catch (error) {
    console.error('[Crop Calendar Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch crop calendar schedule' });
  }
};

module.exports = { getCropSchedule };
