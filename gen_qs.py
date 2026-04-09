import json
import random
import os

questions = []

# --- EASY (50 questions) ---
for i in range(1, 11):
    a = random.randint(2, 9)
    b = random.randint(2, 9)
    ans = a + b
    opts = [str(ans), str(ans+1), str(ans-1), str(ans+2)]
    random.shuffle(opts)
    questions.append({
        "id": f"easy-math-add-{i}", "difficulty": "easy", "category": "Math",
        "prompt": f"What is {a} + {b}?", "options": opts, "answer": str(ans)
    })

easy_words = [
    ("Happy", "Feeling or showing pleasure", ["Sad", "Angry", "Tired"]),
    ("Fast", "Moving at high speed", ["Slow", "Heavy", "Loud"]),
    ("Big", "Of considerable size", ["Small", "Tiny", "Quiet"]),
    ("Cold", "Of or at a low temperature", ["Hot", "Warm", "Bright"]),
    ("Red", "Color of blood", ["Blue", "Green", "Yellow"]),
    ("Dog", "A domesticated carnivorous mammal", ["Cat", "Bird", "Fish"]),
    ("Sun", "The star around which the earth orbits", ["Moon", "Planet", "Comet"]),
    ("Water", "A colorless, transparent liquid", ["Fire", "Earth", "Air"]),
    ("Tree", "A woody perennial plant", ["Bush", "Grass", "Flower"]),
    ("Car", "A four-wheeled road vehicle", ["Boat", "Plane", "Train"])
]
for i, (w, m, incor) in enumerate(easy_words):
    opts = [m] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"easy-word-{i}", "difficulty": "easy", "category": "Vocabulary",
        "prompt": f"Which best describes the word '{w}'?", "options": opts, "answer": m
    })

easy_caps = [
    ("France", "Paris", ["London", "Rome", "Berlin"]),
    ("Japan", "Tokyo", ["Beijing", "Seoul", "Bangkok"]),
    ("Italy", "Rome", ["Madrid", "Athens", "Lisbon"]),
    ("Germany", "Berlin", ["Vienna", "Warsaw", "Prague"]),
    ("Spain", "Madrid", ["Barcelona", "Seville", "Valencia"]),
    ("Canada", "Ottawa", ["Toronto", "Vancouver", "Montreal"]),
    ("Australia", "Canberra", ["Sydney", "Melbourne", "Perth"]),
    ("UK", "London", ["Dublin", "Edinburgh", "Cardiff"]),
    ("China", "Beijing", ["Shanghai", "Hong Kong", "Taipei"]),
    ("Russia", "Moscow", ["St. Petersburg", "Kiev", "Minsk"])
]
for i, (c, a, incor) in enumerate(easy_caps):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"easy-geo-{i}", "difficulty": "easy", "category": "Geography",
        "prompt": f"What is the capital of {c}?", "options": opts, "answer": a
    })

easy_sci = [
    ("What planet is known as the Red Planet?", "Mars", ["Venus", "Jupiter", "Saturn"]),
    ("What gas do we breathe primarily?", "Nitrogen", ["Carbon Dioxide", "Oxygen", "Hydrogen"]),
    ("What is the Earth's natural satellite?", "Moon", ["Sun", "Star", "Meteor"]),
    ("What water form falls from clouds?", "Rain", ["Wind", "Lightning", "Sunlight"]),
    ("Water freezes at what temperature in Celsius?", "0", ["100", "50", "-10"]),
    ("What is the closest star to Earth?", "Sun", ["Sirius", "Alpha Centauri", "Polaris"]),
    ("What pushes objects to the ground?", "Gravity", ["Magnetism", "Friction", "Inertia"]),
    ("How many legs does a spider have?", "8", ["6", "10", "4"]),
    ("What part of the plant conducts photosynthesis?", "Leaf", ["Root", "Stem", "Flower"]),
    ("What is ice made of?", "Water", ["Air", "Glass", "Plastic"])
]
for i, (p, a, incor) in enumerate(easy_sci):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"easy-sci-{i}", "difficulty": "easy", "category": "Science",
        "prompt": p, "options": opts, "answer": a
    })

easy_tech = [
    ("What does PC stand for?", "Personal Computer", ["Private Computer", "Public Computer", "Personal Console"]),
    ("What is the WWW?", "World Wide Web", ["World Web Window", "World Web Wide", "Wild Wide Web"]),
    ("What does HTML stand for?", "Hypertext Markup Language", ["Hypertext Machine Language", "Hightext Markup Language", "Hyperlink Markup Language"]),
    ("Which is a web browser?", "Chrome", ["Windows", "Linux", "MacOS"]),
    ("What is a mouse used for?", "Pointing", ["Typing", "Printing", "Scanning"]),
    ("What does WiFi provide?", "Internet connection", ["Electricity", "Water", "Bluetooth"]),
    ("Which device displays visuals?", "Monitor", ["Keyboard", "Mouse", "Speaker"]),
    ("What symbol is used in email addresses?", "@", ["#", "$", "&"]),
    ("Which company makes the iPhone?", "Apple", ["Microsoft", "Google", "Samsung"]),
    ("What are the 0s and 1s of a computer called?", "Binary", ["Decimal", "Hexadecimal", "Octal"])
]
for i, (p, a, incor) in enumerate(easy_tech):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"easy-tech-{i}", "difficulty": "easy", "category": "Computers",
        "prompt": p, "options": opts, "answer": a
    })


# --- MEDIUM (50 questions) ---
for i in range(1, 11):
    a = random.randint(6, 12)
    b = random.randint(6, 12)
    ans = a * b
    opts = [str(ans), str(ans+10), str(ans-10), str(ans+2)]
    random.shuffle(opts)
    questions.append({
        "id": f"med-math-mult-{i}", "difficulty": "medium", "category": "Math",
        "prompt": f"What is {a} x {b}?", "options": opts, "answer": str(ans)
    })

med_geo = [
    ("What is the longest river in the world?", "Nile", ["Amazon", "Yangtze", "Mississippi"]),
    ("What is the tallest mountain?", "Mount Everest", ["K2", "Kangchenjunga", "Lhotse"]),
    ("Which is the smallest continent?", "Australia", ["Europe", "Antarctica", "South America"]),
    ("What desert is the largest in the world?", "Sahara", ["Arabian", "Gobi", "Kalahari"]),
    ("Which ocean is between Africa and Australia?", "Indian Ocean", ["Pacific Ocean", "Atlantic Ocean", "Southern Ocean"]),
    ("What country has the largest population?", "India", ["China", "USA", "Indonesia"]),
    ("Which continent has the most countries?", "Africa", ["Asia", "Europe", "South America"]),
    ("What is the capital of Brazil?", "Brasilia", ["Rio de Janeiro", "Sao Paulo", "Salvador"]),
    ("In what country is the Taj Mahal located?", "India", ["Pakistan", "Bangladesh", "Nepal"]),
    ("Which country is known as the Land of the Rising Sun?", "Japan", ["China", "South Korea", "Thailand"])
]
for i, (p, a, incor) in enumerate(med_geo):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"med-geo-{i}", "difficulty": "medium", "category": "Geography",
        "prompt": p, "options": opts, "answer": a
    })

med_sci = [
    ("What is the chemical symbol for Gold?", "Au", ["Ag", "Go", "Gd"]),
    ("How many bones are in the adult human body?", "206", ["201", "210", "208"]),
    ("What gas is largely responsible for the greenhouse effect?", "Carbon Dioxide", ["Oxygen", "Nitrogen", "Methane"]),
    ("Who formulated the theory of relativity?", "Albert Einstein", ["Isaac Newton", "Galileo Galilei", "Nikola Tesla"]),
    ("What is the hardest natural substance on Earth?", "Diamond", ["Graphene", "Iron", "Quartz"]),
    ("What part of the cell is known as the powerhouse?", "Mitochondria", ["Nucleus", "Ribosome", "Endoplasmic Reticulum"]),
    ("What is the chemical formula for salt?", "NaCl", ["H2O", "CO2", "HCl"]),
    ("What is the speed of light?", "300,000 km/s", ["150,000 km/s", "1,000,000 km/s", "30,000 km/s"]),
    ("Which blood type is the universal donor?", "O negative", ["A positive", "AB positive", "B negative"]),
    ("What planet is known for its rings?", "Saturn", ["Jupiter", "Uranus", "Neptune"])
]
for i, (p, a, incor) in enumerate(med_sci):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"med-sci-{i}", "difficulty": "medium", "category": "Science",
        "prompt": p, "options": opts, "answer": a
    })

med_tech = [
    ("What does CSS stand for?", "Cascading Style Sheets", ["Creative Style System", "Computer Style Sheets", "Colorful Style System"]),
    ("Which HTML tag is used for the largest heading?", "h1", ["h6", "header", "head"]),
    ("In JavaScript, what represents an empty or unknown value?", "null", ["undefined", "0", "NaN"]),
    ("Which attribute is used to provide alternative text for an image?", "alt", ["title", "src", "href"]),
    ("Which method adds an element to the end of an array in JS?", "push()", ["pop()", "shift()", "unshift()"]),
    ("What does DOM stand for?", "Document Object Model", ["Data Object Model", "Document Oriented Model", "Display Object Management"]),
    ("Which CSS property changes the text color?", "color", ["text-color", "font-color", "style"]),
    ("What is the primary function of a database?", "Storing data", ["Rendering UI", "Routing", "Styling"]),
    ("Which protocol is used for secure web browsing?", "HTTPS", ["HTTP", "FTP", "SSH"]),
    ("What does API stand for?", "Application Programming Interface", ["Advanced Programming Interface", "Application Process Integration", "Automated Program Interface"]),
    ("Which character indicates an ID in CSS?", "#", [".", "@", "*"]),
    ("What is the default port for HTTP?", "80", ["443", "8080", "21"]),
    ("What specifies the background color of an element in CSS?", "background-color", ["color", "bg-color", "background"]),
    ("Which language is primarily used for iOS app development?", "Swift", ["Java", "Kotlin", "C#"]),
    ("What is Git?", "Version control system", ["Programming language", "Database", "Web server"]),
    ("Which method removes the last element of an array in JS?", "pop()", ["push()", "shift()", "delete"]),
    ("What does SQL stand for?", "Structured Query Language", ["Standard Query Language", "Simple Query Language", "Structured Question Language"]),
    ("Which tag creates a hyperlink in HTML?", "a", ["link", "href", "url"]),
    ("What is used to style elements dynamically in JS?", "element.style", ["element.css", "element.design", "element.color"]),
    ("What is the purpose of the 'head' tag in HTML?", "Meta-information", ["Main content", "Footer scripts", "Navigation links"])
]
for i, (p, a, incor) in enumerate(med_tech):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"med-tech-{i}", "difficulty": "medium", "category": "Web Dev",
        "prompt": p, "options": opts, "answer": a
    })

# --- HARD (50 questions) ---
for i in range(1, 11):
    a = random.randint(12, 25)
    b = random.randint(3, 9)
    ans = a * b
    opts = [str(ans), str(ans+b), str(ans-b), str(ans+a)]
    random.shuffle(opts)
    questions.append({
        "id": f"hard-math-{i}", "difficulty": "hard", "category": "Math",
        "prompt": f"What is {a} x {b}?", "options": opts, "answer": str(ans)
    })

hard_tech = [
    ("What is the time complexity of a binary search?", "O(log n)", ["O(n)", "O(n log n)", "O(1)"]),
    ("Which HTTP method is idempotent?", "PUT", ["POST", "PATCH", "CONNECT"]),
    ("What is a closure in JavaScript?", "Function bundled with its lexical environment", ["A completely private variable", "A function that has no return value", "An immediately invoked function"]),
    ("Which CSS property is used for flexbox container cross-axis alignment?", "align-items", ["justify-content", "align-content", "flex-direction"]),
    ("What is Event Delegation in JS?", "Attaching a single listener to a parent", ["Attaching listeners to all children", "Preventing event bubbling", "Creating custom events"]),
    ("What does 'hoisting' refer to in JavaScript?", "Moving declarations to the top", ["Moving assignments to the top", "Lifting CSS specificity", "Elevating variable scope globally"]),
    ("In React, what hook is used for side effects?", "useEffect", ["useState", "useContext", "useReducer"]),
    ("What port does HTTPS use by default?", "443", ["80", "8080", "8443"]),
    ("What is a Promise in JS?", "Object representing eventual completion", ["A strict typing guarantee", "A synchronous return value", "A generator function construct"]),
    ("Which sorting algorithm has the best average time complexity?", "Merge Sort", ["Bubble Sort", "Insertion Sort", "Selection Sort"]),
    ("What is the difference between == and === in JS?", "=== strict equality, == loose", ["=== weak equality, == strict", "No difference", "=== checks pointers, == checks values"]),
    ("What does CORS stand for?", "Cross-Origin Resource Sharing", ["Cross-Origin Routing System", "Current-Origin Request Status", "Cross-Object Resource Sharing"]),
    ("Which principle refers to Single Source of Truth in Redux?", "Store", ["Action", "Reducer", "Dispatch"]),
    ("In SQL, what is a JOIN used for?", "Combining rows from two or more tables", ["Deleting rows from tables", "Updating column types", "Indexing primary keys"]),
    ("Which design pattern ensures only one instance of a class exists?", "Singleton", ["Factory", "Observer", "Decorator"]),
    ("What is the purpose of an Index in a database?", "Improve search speed", ["Compress data", "Encrypt data", "Prevent duplicates natively"]),
    ("In standard Git flow, what branch is typically deployed to production?", "main or master", ["develop", "feature", "hotfix"]),
    ("What is a pure function in FP?", "Always returns same output for same input", ["Function that alters state", "Function with no parameters", "Function that throws no errors"]),
    ("What does IIFE stand for in JS?", "Immediately Invoked Function Expression", ["Internal Instance For Execution", "Immediate Inline Frame Execution", "Invoked Inside Function Environment"]),
    ("Which hash algorithm is cryptographically broken?", "MD5", ["SHA-256", "bcrypt", "Argon2"])
]
for i, (p, a, incor) in enumerate(hard_tech):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"hard-tech-{i}", "difficulty": "hard", "category": "Comp Sci",
        "prompt": p, "options": opts, "answer": a
    })

hard_gk = [
    ("What is the capital of Burkina Faso?", "Ouagadougou", ["Bamako", "Niamey", "Dakar"]),
    ("Who painted the 'Guernica'?", "Pablo Picasso", ["Salvador Dali", "Vincent van Gogh", "Claude Monet"]),
    ("In which year did the Byzantine Empire fall?", "1453", ["1066", "1492", "1215"]),
    ("What is the rarest blood type in humans?", "AB negative", ["O negative", "B negative", "AB positive"]),
    ("What is the heaviest naturally occurring element by atomic weight?", "Uranium", ["Plutonium", "Lead", "Osmium"]),
    ("Which planet has a moon named Triton?", "Neptune", ["Uranus", "Jupiter", "Saturn"]),
    ("Who wrote the epic poem 'Paradise Lost'?", "John Milton", ["William Shakespeare", "Geoffrey Chaucer", "Dante Alighieri"]),
    ("Which philosophical concept is associated with 'tabula rasa'?", "John Locke", ["Rene Descartes", "Immanuel Kant", "Friedrich Nietzsche"]),
    ("What is the deepest known point in the Earth's oceans?", "Mariana Trench", ["Tonga Trench", "Philippine Trench", "Kermadec Trench"]),
    ("Which country produces the most coffee beans globally?", "Brazil", ["Vietnam", "Colombia", "Ethiopia"]),
    ("What was the first artificial Earth satellite?", "Sputnik 1", ["Explorer 1", "Vanguard 1", "Telstar 1"]),
    ("In chemistry, what is the 'Gibbs free energy' used to predict?", "Spontaneity of a reaction", ["Rate of a reaction", "Activation energy", "Equilibrium constant"]),
    ("Who composed the 'Ring Cycle'?", "Richard Wagner", ["Ludwig van Beethoven", "Johann Sebastian Bach", "Wolfgang Amadeus Mozart"]),
    ("What is the study of mushrooms called?", "Mycology", ["Botany", "Entomology", "Ichthyology"]),
    ("Which empire was ruled by the 'Sapa Inca'?", "Inca Empire", ["Aztec Empire", "Maya Empire", "Olmec Empire"]),
    ("What is the atomic number of Iron?", "26", ["30", "28", "24"]),
    ("Who won the Nobel Prize in Physics in 1921?", "Albert Einstein", ["Niels Bohr", "Max Planck", "Marie Curie"]),
    ("What is the highest mountain outside of Asia?", "Aconcagua", ["Mount Kilimanjaro", "Mount Elbrus", "Denali"]),
    ("Which battle is considered the turning point of the American Civil War?", "Gettysburg", ["Antietam", "Bull Run", "Vicksburg"]),
    ("What is the monetary unit of Japan?", "Yen", ["Won", "Yuan", "Ringgit"])
]
for i, (p, a, incor) in enumerate(hard_gk):
    opts = [a] + incor
    random.shuffle(opts)
    questions.append({
        "id": f"hard-gk-{i}", "difficulty": "hard", "category": "Trivia",
        "prompt": p, "options": opts, "answer": a
    })

js_file = "window.QUIZ_QUESTIONS = " + json.dumps(questions, indent=2) + ";"

with open("C:/New project/questions.js", "w") as f:
    f.write(js_file)

print(f"Total questions generated and written to questions.js: {len(questions)}")
