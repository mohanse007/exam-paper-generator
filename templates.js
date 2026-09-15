const TEMPLATES = {
  commerce: {
    paperCode: "[BC-S452]",
    collegeName: "ST.ANN’S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "Malkapuram, Visakhapatnam-530011",
    examDetails: "Honors - Degree Examinations - IV-Semester (Admitted Batch : 2024-2025)",
    subjectTitle: "COURSE 10: COST AND MANAGEMENT ACCOUNTING",
    streamDetails: "B.Com - MAJOR - II",
    timeStr: "Time:3Hrs",
    maxMarksStr: "Max Marks:60",
    
    sectionA: {
      title: "SECTION - A",
      instruction: "I. Answer any Five questions.",
      marks: "5x4=20",
      questions: [
        "Write about Cost Sheet",
        "Functions of Management Accounting",
        "Base Stock Method",
        "Economic order Quantity.",
        "Common Size Statements.",
        "Break Even Analysis.",
        "Marginal Costing",
        "Margin of Safety."
      ]
    },

    sectionB: {
      title: "SECTION - B",
      instruction: "II. Answer ALL the following questions.",
      marks: "5x8=40",
      questions: [
        {
          num: 9,
          page: 1,
          a: "What is Cost Accounting? Explain its Advantages and Disadvantages",
          choice: "Or",
          b: "Prepare Cost Sheet with the following Data of STAR Ltd. : Direct Material-20,000, Direct Labour-8,000, Indirect Labour(Factory)- 2,500, Supervision Costs (Factory)- 1,000, Factory Rent-1,600, Factory Lighting-600, Oil for machines-100, Depreciation of machines-500, Office Overheads-8.000, Office Salaries-2,000, Rent and Rates-1,000, Selling and Distribution Overheads-6,000, Total Sales-1,50,000."
        },
        {
          num: 10,
          page: 1,
          a: "Using LIFO method prepare Stores Ledger:\n2024, Jan 1 Purchases 100kg @Rs.10/-.\n“ 7 Purchases 50kg @ Rs.9/-\n“ 10 Issued 80kg\n“ 15 Purchases 100kg @ Rs.11/-\n“ 20 Issued 70kg\n“ 23 Issued 40 kg",
          choice: "Or",
          b: "Write about various methods of Valuation of Material Issues."
        },
        {
          num: 11,
          page: 2,
          a: "From the balance sheet calculate current ratio, acid test ratio, absolute liquidity ratio.\n<table class=\"paper-table\">\n<tr><td>current assets</td><td>Amount</td><td>current liabilities</td><td>Amount</td></tr>\n<tr><td>Bills receivable</td><td>70,000</td><td>Bills payable</td><td>60,000</td></tr>\n<tr><td>Sundry debtors</td><td>90,000</td><td>Sundry creditors</td><td>70,000</td></tr>\n<tr><td>Bank balance</td><td>45,000</td><td>Bank overdraft</td><td>50,000</td></tr>\n<tr><td>short term investment</td><td>25,000</td><td>ols expenses</td><td>5000</td></tr>\n<tr><td>Pre paid expenses</td><td>5000</td><td></td><td></td></tr>\n<tr><td>Stock</td><td>30000</td><td></td><td></td></tr>\n<tr><td><b>2,65,000</b></td><td></td><td><b>185000</b></td><td></td></tr>\n</table>",
          choice: "(or)",
          b: "Explain Various Profitability ratios"
        },
        {
          num: 12,
          page: 2,
          a: "What are the Advantages and Limitations of Financial Statement Analysis?",
          choice: "Or",
          b: "Prepare Comparative Income Statement from the following particulars:\n<table class=\"paper-table bordered\">\n<tr><th>Particulars</th><th>2024</th><th>2025</th></tr>\n<tr><td>Sales</td><td>3,00,000</td><td>4,00,000</td></tr>\n<tr><td>Cost of goods sold</td><td>1,50,000</td><td>2,00,000</td></tr>\n<tr><td>Office Expenses</td><td>25,000</td><td>60,000</td></tr>\n<tr><td>Distribution Expenses</td><td>10,000</td><td>40,000</td></tr>\n</table>"
        },
        {
          num: 13,
          page: 2,
          a: "What is Break-Even Analysis? Explain with an Example and Chart",
          choice: "Or",
          b: "The following Information of Blue Sky Ltd. on 31-12-2024:\nSales - 5,00,000\nVariable Expenses - Rs. 30/- per Unit\nFixed Expenses - Rs. 50,000\nSold Units - 10,000\nCalculate: 1. P/V Ratio, 2. B.E.P Units, 3. Break-Even Sales, 4. Profit, 5.Margin of safety."
        }
      ]
    }
  },

  telugu: {
    paperCode: "[TEL-S202]",
    collegeName: "ST.ANN’S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "Malkapuram, Visakhapatnam-530011",
    examDetails: "Honors - Degree Examinations - II-Semester (Admitted Batch : 2025-2026)",
    subjectTitle: "TELUGU",
    streamDetails: "SAHITHI KUSUMALU",
    timeStr: "Time:3Hrs",
    maxMarksStr: "Max Marks:60",

    sectionA: {
      title: "SECTION - A",
      instruction: "I. క్రింది ఇచ్చిన ప్రశ్నల్లో ఏవైనా ఐదు ప్రశ్నలకు సమాధానాలు రాయండి.",
      marks: "5x4=20",
      questions: [
        "ఈక్రింది వాటిలో ఒక పద్యాన్ని పాదభంగం లేకుండా పూరించండి\nఅ) తనవెంటన్ సిరి ____________ గలుగు వారాల గోపాలుమున్\n(లేదా)\nఆ) యతిమూర్ధన్యుడు ____________ నీ చిత్తంబులే నెంచుమా",
        "ఆర్వీయస్ సుందరం గురించి రాయండి.",
        "’ గజేంద్రమోక్షం ’ సందేశం ఏమిటి?",
        "సుక్క పంది స్వభావం ఎలాంటిది?",
        "అగ్నిహోత్రావధాన్లు పాత్ర స్వభావం తెలపండి.",
        "’ యక్షగానం ’ గురించి తెలపండి.",
        "క్రింది వానిలో ఒక అలంకారాన్ని వివరించండి.\nఅ) యమకం   ఆ) అర్ధాంతరన్యాసం",
        "క్రింది వానిలో ఒక దానిని వివరించండి.\nఅ) చంపకమాల   ఆ) కందం"
      ]
    },

    sectionB: {
      title: "SECTION - B",
      instruction: "II. ప్రతి విభాగం నుండి ఒక్కొక్క ప్రశ్నకు జవాబు రాయండి.",
      marks: "5x8=40",
      questions: [
        {
          num: 9,
          page: 1,
          a: "క్రింది పద్యాలలో ఒకదానికి ప్రతిపదార్థ తాత్పర్యాలు రాయండి.\nఅ) సిరికిం జెప్పడు శంఖ చక్ర యుగంబు జేదోయి సంధింపఁ డే\nపరివారంబును జీరఁ డభ్రగపతిం బన్నింపఁడాకర్ణికాం\nతర ధమ్మిల్లముంజెక్కు నొెత్తడు వివాద ప్రోద్ధత శ్రీ కుచో\nపరి చేలాంచల మైన వీడఁడు గజ ప్రాణావనోత్సాహి యై",
          choice: "(లేదా)",
          b: "ఆ) శివకోదండము ద్రుంచె వాలి నడంచన్ జేపట్టె సుగ్రీవునిన్\nబ్లవగశ్రేణుల నేలే క్షారజల ధిన్ బంధించెఁ బౌలస్త్యునా\nహవభూమిన్ దెగటార్చె నీవనితికై యర్మాన్వయ స్వామీ య\nట్టివధూటిన్ బెడఁబాసి నిల్వఁగఁ గుర్తుండే తాల్మి చింతంబునన్"
        },
        {
          num: 10,
          page: 1,
          a: "గజేంద్రుణ్ణి రక్షించడానికి బయలుదేరిన విష్ణుమూర్తి సన్నద్ధత గురించి విశ్లేషించండి.",
          choice: "(లేదా)",
          b: "సీతాసాత్యనం సారాంశాన్ని సొంతమాటల్లో రాయండి."
        },
        {
          num: 11,
          page: 2,
          a: "ముసలివాడు అడవి జయించాడా లేక ఓడిపోయాడా మీ అభిప్రాయాలతో సమర్థించండి.",
          choice: "(లేదా)",
          b: "’అతడు అడవిని జయించాడు’ నవల ఆధారంగా కేశవరెడ్డి రచనా శైలిని విశ్లేషించండి."
        },
        {
          num: 12,
          page: 2,
          a: "గిరీశం పాత్రను విశ్లేషించండి.",
          choice: "(లేదా)",
          b: "కన్యాశుల్కం నాటకం ద్వితీయ అంకం సారాంశాన్ని తెలపండి."
        },
        {
          num: 13,
          page: 2,
          a: "తెలుగువారి జానపద కళారూపాల గురించి పరిచయం చేయండి.",
          choice: "(లేదా)",
          b: "అతి ప్రాచీనమైన తెలుగువారి కళారూపం ‘తోలుబొమ్మలాట’ను విశ్లేషించండి."
        }
      ]
    }
  },

  math: {
    paperCode: "[BSM-S452M]",
    collegeName: "ST.ANN’S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "Malkapuram, Visakhapatnam-530011",
    examDetails: "Honors - Degree Examinations - IV-Semester (Admitted Batch : 2024-2025)",
    subjectTitle: "INTRODUCTION TO REAL ANALYSIS & PROBLEM SOLVING",
    streamDetails: "Mathematics- MINOR - II",
    timeStr: "Time:3Hrs",
    maxMarksStr: "Max Marks:60",

    sectionA: {
      title: "SECTION - A",
      instruction: "I. Answer any Five questions.",
      marks: "5x4=20",
      questions: [
        "If $s_n = \\sqrt{n+1} - \\sqrt{n}$ then show that $\\lim_{n\\to\\infty} s_n = 0$",
        "Test for convergence of $\\sum \\frac{2^n}{n^3}$",
        "Discuss the continuity of the function $f : R \\to R$ at $x = 0$ where $f(x) = \\frac{|x|}{x}$",
        "Using Lagrange mean value theorem prove that $\\frac{x}{1+x} < \\log(1+x) < x$ if $f(x) = \\log(1+x), \\forall x > 0$",
        "Evaluate $\\lim_{n\\to\\infty} \\sum_{k=0}^{k=n} \\frac{n}{n^2 + k^2}$",
        "Define upper and lower Riemann sums of a bounded function $f : [a,b] \\to R$ for a partition $P : \\{a = x_0, x_1, x_2, \\dots x_n = b\\}$",
        "Show that limit of a sequence, if exists, is unique",
        "Discuss the continuity of the function $f : R \\to R$ at $x = 0$ where $f$ is given by\n$$f(x) = \\begin{cases} x \\sin \\frac{1}{x} & \\text{if } x \\neq 0 \\\\ 0 & \\text{if } x = 0 \\end{cases}$$"
      ]
    },

    sectionB: {
      title: "SECTION - B",
      instruction: "II. Answer ALL the following questions.",
      marks: "5x8=40",
      questions: [
        {
          num: 9,
          page: 1,
          a: "Show that $\\lim_{n\\to\\infty} \\sqrt[n]{n} = 1$",
          choice: "(or)",
          b: "State and prove cauchy's General Principle"
        },
        {
          num: 10,
          page: 1,
          a: "Test for convergence of the series $\\sum \\frac{2^{n-2}}{2^{n+1}} x^n$ for all $x > 0$",
          choice: "(or)",
          b: "State and prove Leibnitz's test for convergence of alternating series"
        },
        {
          num: 11,
          page: 2,
          a: "Determine the constants $a, b$ so that the function $f : R \\to R$ defined by\n$$f(x) = \\begin{cases} \\frac{\\sin(a+1)x + \\sin x}{x} & \\text{if } x < 0 \\\\ c & \\text{if } x = 0 \\\\ \\frac{\\sqrt{x+bx^2} - \\sqrt{x}}{b\\sqrt{x^3}} & \\text{if } x > 0 \\end{cases}$$\nis continuous everywhere",
          choice: "(or)",
          b: "Let $f : [a, b] \\to R$, if $f$ is continuous on $[a, b]$ and $f(a), f(b)$ have opposite signs then show that there exists $c \\in (a, b)$ such that $f(c) = 0$"
        },
        {
          num: 12,
          page: 2,
          a: "Investigate differentiability of the function $f(x) = |x| + |x-1|$ for $x \\in R$",
          choice: "(or)",
          b: "State and prove Cauchy's mean value theorem"
        },
        {
          num: 13,
          page: 2,
          a: "Prove that $\\frac{\\pi^2}{24} < \\int_0^\\pi \\frac{x^2}{5 + 3\\cos x} dx < \\frac{\\pi^3}{6}$",
          choice: "(or)",
          b: "State and prove fundamental theorem of integral calculus"
        }
      ]
    }
  },

  blank: {
    paperCode: "[CODE-001]",
    collegeName: "ST.ANN’S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "Malkapuram, Visakhapatnam-530011",
    examDetails: "Honors - Degree Examinations - Semester (Admitted Batch : 2024-2025)",
    subjectTitle: "SUBJECT / PAPER TITLE",
    streamDetails: "Stream / Degree Details",
    timeStr: "Time:3Hrs",
    maxMarksStr: "Max Marks:60",

    sectionA: {
      title: "SECTION - A",
      instruction: "I. Answer any Five questions.",
      marks: "5x4=20",
      questions: ["", "", "", "", "", "", "", ""]
    },

    sectionB: {
      title: "SECTION - B",
      instruction: "II. Answer ALL the following questions.",
      marks: "5x8=40",
      questions: [
        { num: 9, page: 1, a: "", choice: "Or", b: "" },
        { num: 10, page: 1, a: "", choice: "Or", b: "" },
        { num: 11, page: 2, a: "", choice: "Or", b: "" },
        { num: 12, page: 2, a: "", choice: "Or", b: "" },
        { num: 13, page: 2, a: "", choice: "Or", b: "" }
      ]
    }
  }
};
