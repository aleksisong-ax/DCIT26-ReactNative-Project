// Each lesson includes a visual example and the first practice question.
export const mathTiers = [
  {
    id: 'primary',
    title: 'Primary',
    grades: 'Grades 1–3',
    description: 'Build concrete foundations with numbers and everyday examples.',
    lessons: [
      {
        id: 'number-sense',
        title: 'Number sense',
        icon: '123',
        topics: [
          ['Counting', 'Count forward and backward to 10,000. Skip counting can help: 2, 4, 6, 8.'],
          ['Place value', 'In 3,482, the 3 is thousands, 4 is hundreds, 8 is tens, and 2 is ones.'],
          [
            'Compare and order',
            'Compare digits from left to right: 3,482 > 3,428. Arrange numbers from least to greatest.',
          ],
          [
            'Odd, even, and ordinal',
            'Even numbers can be paired; odd numbers leave one unpaired. Ordinals show position: first, second, third.',
          ],
          [
            'Unit fractions',
            'Equal parts make a whole. One of two equal parts is 1/2; one of four equal parts is 1/4.',
          ],
        ],
        visual: { label: 'One out of four equal parts is shaded', tiles: ['■', '□', '□', '□'] },
        question: 'What fraction of these four equal parts is shaded?',
        options: ['1/2', '1/4', '4/4'],
        answer: 1,
        explanation: 'One of the four equal parts is shaded, so the fraction is 1/4.',
      },
      {
        id: 'operations',
        title: 'Four basic operations',
        icon: '+ −',
        topics: [
          [
            'Addition',
            'Addition joins amounts. When a place has ten or more, regroup into the next place: 28 + 5 = 33.',
          ],
          [
            'Subtraction',
            'Subtraction finds what is left or the difference. Regroup when a place does not have enough: 32 − 7 = 25.',
          ],
          [
            'Multiplication',
            'Multiplication is repeated addition. Practice the 1–10 tables: 3 × 4 = 4 + 4 + 4 = 12.',
          ],
          [
            'Division',
            'Division can mean sharing equally. Sharing 12 objects among 3 people gives 4 each.',
          ],
        ],
        visual: {
          label: 'Three equal groups, each with four dots',
          tiles: ['● ● ● ●', '● ● ● ●', '● ● ● ●'],
        },
        question: 'How many dots are in 3 groups of 4?',
        options: ['7', '12', '16'],
        answer: 1,
        explanation: 'Add 4 + 4 + 4, or multiply 3 × 4, to get 12.',
      },
      {
        id: 'word-problems',
        title: 'Word problem-solving',
        icon: '?',
        topics: [
          [
            'Understand the story',
            'Identify what is given and what you need to find. A one-step problem needs one operation; a two-step problem needs two.',
          ],
          [
            'Look for clues',
            'Words like altogether, left, and each may offer clues, but always use the meaning of the story to choose an operation.',
          ],
          [
            'Draw a bar model',
            'A bar can show a whole divided into parts. Label what you know and the part you need to find.',
          ],
        ],
        visual: {
          label: 'Bar model: five red pencils plus three blue pencils',
          tiles: ['5 pencils', '+', '3 pencils'],
        },
        question: 'Ana has 5 pencils and gets 3 more. How many does she have altogether?',
        options: ['2', '8', '15'],
        answer: 1,
        explanation: 'Join the two parts: 5 + 3 = 8 pencils.',
      },
      {
        id: 'measurement',
        title: 'Everyday measurement',
        icon: '◷',
        topics: [
          [
            'Time and calendars',
            'Read hours and minutes on analog and digital clocks. Seven days make a week; months have different numbers of days.',
          ],
          [
            'Philippine money',
            'The peso (₱) is Philippine money. Coins and bills have different values; add their values to find a total.',
          ],
          ['Length', 'Use centimeters (cm) for shorter lengths and meters (m) for longer lengths.'],
          [
            'Mass and capacity',
            'Mass can be measured in grams (g) and kilograms (kg). Capacity can be measured in milliliters (mL) and liters (L).',
          ],
        ],
        visual: { label: 'One ten-peso coin and one five-peso coin', tiles: ['₱10', '+', '₱5'] },
        question: 'How much money is shown?',
        options: ['₱5', '₱15', '₱50'],
        answer: 1,
        explanation: '₱10 + ₱5 = ₱15.',
      },
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    grades: 'Grades 4–6',
    description: 'Move from concrete models toward abstract reasoning.',
    lessons: [
      {
        id: 'number-sense',
        title: 'Number sense',
        icon: '123',
        topics: [
          [
            'Place value and decimals',
            'Place values extend to millions. Decimal places to the right of the point include tenths and hundredths.',
          ],
          [
            'Factors and multiples',
            'Factors divide a number exactly; multiples are products of a number. A prime has exactly two positive factors; a composite has more than two.',
          ],
          [
            'Fractions',
            'Equivalent fractions have the same value: 1/2 = 2/4. A mixed number combines a whole and a fraction; an improper fraction has a numerator at least as large as its denominator.',
          ],
          [
            'Ratios and percentages',
            'A ratio compares quantities. Proportions express equal ratios. Percent means per hundred: 25% = 25/100.',
          ],
          [
            'Integers',
            'Positive numbers are above zero and negative numbers are below zero on a number line.',
          ],
        ],
        visual: { label: 'One half is equal to two quarters', tiles: ['1 / 2', '=', '2 / 4'] },
        question: 'Which fraction is equivalent to 1/2?',
        options: ['1/4', '2/4', '3/4'],
        answer: 1,
        explanation: 'Multiply the numerator and denominator of 1/2 by 2 to get 2/4.',
      },
      {
        id: 'operations',
        title: 'Four basic operations',
        icon: '× ÷',
        topics: [
          [
            'Multi-digit operations',
            'Use place value to multiply multi-digit numbers and long division to divide them. Check division by multiplying.',
          ],
          [
            'Order of operations',
            'Use PEMDAS/GEMDAS: group first, then exponents, then multiplication and division from left to right, then addition and subtraction from left to right.',
          ],
          [
            'Add and subtract fractions',
            'Use a common denominator, then add or subtract numerators. For example, 1/4 + 2/4 = 3/4.',
          ],
          [
            'Multiply and divide fractions',
            'Multiply numerators and denominators. To divide by a nonzero fraction, multiply by its reciprocal.',
          ],
          [
            'Decimal operations',
            'Align decimal points to add or subtract. Use place value to multiply or divide decimals, and estimate to check the result.',
          ],
        ],
        visual: { label: 'Expression: two plus three times four', tiles: ['2', '+', '3 × 4'] },
        question: 'Using the order of operations, what is 2 + 3 × 4?',
        options: ['20', '14', '24'],
        answer: 1,
        explanation: 'Multiply first: 3 × 4 = 12. Then add 2 to get 14.',
      },
      {
        id: 'word-problems',
        title: 'Word problem-solving',
        icon: '?',
        topics: [
          [
            'Polya’s four steps',
            'Understand the problem, plan a strategy, solve it, then check whether the answer makes sense.',
          ],
          [
            'Multi-step problems',
            'Break a problem into smaller steps. Routine problems use familiar methods; non-routine problems may need a new strategy.',
          ],
          [
            'Work backward',
            'Start with the result and undo each operation to find the starting value.',
          ],
          [
            'Guess and check',
            'Make a reasonable guess, test it against the conditions, and adjust if needed.',
          ],
        ],
        visual: {
          label: 'Unknown starting amount, plus seven, equals nineteen',
          tiles: ['?', '+ 7', '= 19'],
        },
        question: 'A number plus 7 is 19. What is the number?',
        options: ['12', '19', '26'],
        answer: 0,
        explanation: 'Work backward by subtracting: 19 − 7 = 12. Check: 12 + 7 = 19.',
      },
      {
        id: 'measurement',
        title: 'Everyday measurement',
        icon: '◷',
        topics: [
          [
            'Metric conversions',
            '1 km = 1,000 m and 1 kg = 1,000 g. Multiply or divide by 1,000 when converting between these units.',
          ],
          [
            'Elapsed time',
            'Elapsed time is the time between a start and an end. In the 24-hour clock, 2:00 p.m. is 14:00.',
          ],
          [
            'Perimeter and area',
            'Perimeter is distance around a shape. Rectangle area = length × width; triangle area = 1/2 × base × height; circle area = π × radius².',
          ],
          [
            'Volume',
            'For a rectangular prism, volume = length × width × height. A cube has equal side lengths.',
          ],
          [
            'Temperature and motion',
            'Read temperature on a scale. For steady speed, distance = speed × time, using matching units.',
          ],
        ],
        visual: {
          label: 'A rectangle with length six centimeters and width three centimeters',
          tiles: ['6 cm', '×', '3 cm'],
        },
        question: 'What is the area of a rectangle 6 cm long and 3 cm wide?',
        options: ['9 cm²', '18 cm²', '18 cm'],
        answer: 1,
        explanation: 'Area = length × width = 6 × 3 = 18 square centimeters (cm²).',
      },
    ],
  },
];
