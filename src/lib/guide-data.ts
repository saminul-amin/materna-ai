/**
 * Week-by-week pregnancy guide (general educational information).
 * This content is general guidance and is NOT individualized medical treatment.
 * Always follow the advice of your own qualified healthcare professional.
 */
export interface WeekGuide {
  week: number;
  size: string;
  baby: string;
  body: string;
  care: string;
  appointments: string;
  mental: string;
  birthPrep?: string;
}

const trimesterCare = {
  1: "Take folic acid as advised, avoid alcohol and smoking, and drink plenty of water. Rest when you feel tired.",
  2: "Continue your supplements as advised, eat a varied diet with iron-rich foods, and keep gently active if your provider agrees.",
  3: "Pay attention to your baby's movements each day, rest with your legs raised when swollen, and keep your antenatal card with you.",
};

const trimesterMental = {
  1: "Mood swings and worry are common early on. Talk with someone you trust about how you are feeling.",
  2: "Many people feel more energetic now. Use this time to build routines that help you relax.",
  3: "Anxiety about birth is normal. Writing down questions for your provider can make it feel more manageable.",
};

const raw: [number, string, string, string, string][] = [
  // week, size, baby, body, appointments
  [1, "Not yet visible", "Pregnancy weeks are counted from the first day of your last period, so conception has not yet happened.", "This is the week of your last period. Your body is preparing for a possible pregnancy.", "If you are planning a pregnancy, a pre-pregnancy check-up is a good idea."],
  [2, "Not yet visible", "Ovulation usually happens around the end of this week.", "Your body releases an egg; fertilisation may occur.", "Folic acid is generally advised before conception — ask your provider."],
  [3, "Smaller than a grain of salt", "The fertilised egg travels to the uterus and begins to implant.", "You may not notice anything yet. Light spotting can happen with implantation.", "No visit needed unless advised."],
  [4, "Poppy seed", "The embryo implants and the placenta begins to form.", "A missed period is often the first sign. Home tests may become positive.", "Take a pregnancy test if your period is late."],
  [5, "Sesame seed", "The neural tube, which becomes the brain and spinal cord, starts to form.", "Tiredness, tender breasts and nausea may begin.", "Book your first antenatal visit."],
  [6, "Lentil", "The heart begins to beat. Tiny buds that become arms and legs appear.", "Nausea (any time of day) and frequent urination are common.", "First antenatal visit is usually arranged around weeks 6–10."],
  [7, "Blueberry", "The brain grows rapidly and facial features begin to develop.", "Food aversions and a heightened sense of smell are typical.", "Prepare a list of your health history for your first visit."],
  [8, "Raspberry", "Fingers and toes begin to form; the embryo moves, though you cannot feel it.", "Bloating and mild cramping can occur. Rest when needed.", "Your first visit usually includes blood pressure, weight, and blood tests."],
  [9, "Cherry", "The embryo is now called a fetus. Major organs continue forming.", "Mood changes are common due to hormones.", "Ask about which tests are offered locally."],
  [10, "Strawberry", "Vital organs are formed and starting to function. Bones begin to harden.", "You may notice your waistline changing slightly.", "An early dating scan may be arranged around now if available."],
  [11, "Fig", "The fetus can open and close its fists. Tooth buds form.", "Nausea may begin to ease for some. Energy may still be low.", "Discuss any medication you take with your provider."],
  [12, "Lime", "Reflexes develop; the fetus may move in response to touch.", "The uterus rises above the pelvis. Risk of miscarriage falls after this point.", "Many people share their news now. First-trimester screening may be offered."],
  [13, "Pea pod", "Fingerprints are forming. Vocal cords develop.", "End of the first trimester. Energy often improves.", "Ensure your first-trimester tests are complete."],
  [14, "Lemon", "The fetus can make facial expressions. Hair begins to grow.", "Appetite may return. A small bump may show.", "Routine antenatal visits are typically every 4 weeks in the second trimester."],
  [15, "Apple", "Bones continue to harden; the skeleton may show on a scan.", "Nasal congestion and nosebleeds can occur due to increased blood flow.", "Ask about the timing of your anomaly scan."],
  [16, "Avocado", "Eyes can slowly move; the fetus may start to hear muffled sounds.", "Some feel the first flutters of movement, especially in second pregnancies.", "A visit around now usually checks BP, weight and your general wellbeing."],
  [17, "Pear", "Fat begins to form under the skin. The umbilical cord thickens.", "Back discomfort may begin as your posture changes.", "Good time to ask about safe exercise."],
  [18, "Sweet potato", "The nervous system matures quickly. Ears are in their final position.", "Movements may become noticeable ('quickening').", "The anomaly (mid-pregnancy) scan is often between 18 and 22 weeks."],
  [19, "Mango", "A protective coating (vernix) covers the skin.", "Leg cramps and round-ligament pain are common.", "Note any questions for your scan appointment."],
  [20, "Banana", "Halfway point. The fetus swallows and produces meconium.", "Your bump is more visible. Heartburn may start.", "Anomaly scan is usually done around now."],
  [21, "Carrot", "Eyebrows and eyelids are formed. Movements become stronger.", "You may feel regular kicks. Skin changes such as a dark line may appear.", "Routine visit: blood pressure and urine check."],
  [22, "Papaya", "The fetus looks like a tiny newborn. Grip strengthens.", "Swelling of feet may begin at the end of the day.", "Ask when your glucose screening test is due."],
  [23, "Grapefruit", "The lungs develop the structures needed for breathing.", "Braxton Hicks (practice tightenings) may be felt.", "Keep recording BP if you have a monitor."],
  [24, "Corn cob", "Hearing improves; the fetus may respond to your voice.", "Your uterus is now near your navel.", "Glucose screening is often done between weeks 24 and 28."],
  [25, "Cauliflower", "Hair may have colour and texture. Fat continues to build.", "Frequent urination returns as the uterus grows.", "Discuss iron levels if you feel very tired."],
  [26, "Lettuce head", "Eyes begin to open. The fetus responds to light.", "Sleep may become harder; try side-lying with pillows.", "Routine visit: BP, weight, fundal height."],
  [27, "Cabbage", "Brain activity increases. Regular sleep-wake cycles begin.", "End of the second trimester. Leg cramps and backache are common.", "Plan your third-trimester visit schedule."],
  [28, "Aubergine", "The fetus can blink and has eyelashes. Rapid weight gain starts.", "Third trimester begins. Shortness of breath is common as the uterus rises.", "Visits often become more frequent (every 2–3 weeks). Some blood tests are repeated."],
  [29, "Butternut squash", "Bones are fully developed but still soft. Muscles strengthen.", "You may feel more kicks and rolls; learn your baby's pattern.", "Ask about tetanus (TT) vaccination status if not complete."],
  [30, "Cucumber", "The brain grows rapidly; the fetus can regulate temperature a little.", "Tiredness may return. Swelling and heartburn are common.", "Discuss your birth plan and preferred facility with your provider."],
  [31, "Coconut", "The fetus can turn its head and process more information.", "Practice tightenings may be more noticeable.", "Continue routine BP and urine checks."],
  [32, "Jicama", "Fingernails have grown; the fetus practices breathing movements.", "Sleep interruptions increase. Pelvic pressure may build.", "Ask what to expect at delivery and when to go to the facility."],
  [33, "Pineapple", "The immune system develops using your antibodies.", "You may feel warmer than usual. Balance can change.", "Check that your delivery bag list is ready."],
  [34, "Cantaloupe", "The lungs are nearly mature. Most babies are now head-down.", "Vision changes or severe headache should be reported promptly.", "Visits usually every 2 weeks now."],
  [35, "Honeydew", "Kidneys are fully developed. The fetus gains weight quickly.", "Frequent urination and Braxton Hicks continue.", "Some providers offer a Group B strep test around now."],
  [36, "Romaine lettuce", "The baby may 'drop' lower into the pelvis.", "Breathing may feel easier but pelvic pressure increases.", "Weekly visits usually begin from around now."],
  [37, "Swiss chard", "Considered 'early term'. The baby practices sucking.", "Loss of the mucus plug can occur. Rest as much as you can.", "Confirm your transport plan and who to call."],
  [38, "Leek", "Organs are ready for life outside. The baby sheds the fine body hair.", "Watch for signs of labour: regular contractions, waters breaking.", "Weekly visit: position of baby and BP check."],
  [39, "Watermelon (small)", "Full term. The brain is still developing rapidly.", "Contractions may start; time them when they become regular.", "Know the danger signs and when to go to the facility."],
  [40, "Pumpkin (small)", "Your due date. Most babies arrive within two weeks either side.", "If labour has not started, your provider will discuss the next steps.", "Attend your visit for monitoring; ask about post-date plans."],
];

export const WEEK_GUIDE: WeekGuide[] = raw.map(([week, size, baby, body, appointments]) => {
  const t = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const g: WeekGuide = {
    week,
    size,
    baby,
    body,
    care: trimesterCare[t],
    appointments,
    mental: trimesterMental[t],
  };
  if (week >= 28) {
    g.birthPrep =
      week < 34
        ? "Start your birth-preparedness checklist: emergency contact, preferred facility, transport, documents."
        : "Finalise your plan: pack essentials, agree who will accompany you, keep 999 and your emergency contact handy.";
  }
  return g;
});

export function guideForWeek(week: number) {
  return WEEK_GUIDE[Math.max(1, Math.min(40, week)) - 1];
}
