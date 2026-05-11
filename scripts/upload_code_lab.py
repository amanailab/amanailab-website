"""
Run: python upload_code_lab.py
Uploads 20 hand-crafted AI/ML Code Lab problems with full test cases.
"""
import requests

SITE_URL = "https://amanailab.com"
API_KEY  = "amanailab2026secret123"

PROBLEMS = [
  {
    "order_index": 1,
    "title": "Softmax Function",
    "slug": "softmax-function",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Math", "Probability", "LLM"],
    "companies": ["OpenAI", "Google", "Meta"],
    "hints": ["Use math.exp() for the exponential.", "Divide each exp(x) by the sum of all exp values.", "Round to 5 decimal places."],
    "description": "## Softmax Function\n\nConvert a list of real numbers (logits) into a **probability distribution**.\n\n### Formula\n`softmax(xᵢ) = exp(xᵢ) / Σ exp(xⱼ)`\n\n### Example\n```\nInput:  [1.0, 2.0, 3.0]\nOutput: [0.09003, 0.24473, 0.66524]\n```\n\n### Constraints\n- Round each value to **5 decimal places**",
    "starter_code": "def softmax(logits: list) -> list:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"softmax([1.0, 2.0, 3.0])","expected_output":"[0.09003, 0.24473, 0.66524]","is_hidden":False,"description":"Basic 3-element"},
      {"id":2,"function_call":"softmax([0.0, 0.0, 0.0])","expected_output":"[0.33333, 0.33333, 0.33333]","is_hidden":False,"description":"Uniform input"},
      {"id":3,"function_call":"softmax([1.0])","expected_output":"[1.0]","is_hidden":True,"description":"Single element"},
      {"id":4,"function_call":"softmax([10.0, -10.0])","expected_output":"[1.0, 0.0]","is_hidden":True,"description":"Extreme values"},
    ]
  },
  {
    "order_index": 2,
    "title": "Cosine Similarity",
    "slug": "cosine-similarity",
    "difficulty": "Easy",
    "topic": "Vector DB",
    "tags": ["Vector DB", "Embeddings", "Math"],
    "companies": ["Pinecone", "OpenAI", "Google"],
    "hints": ["cos(a,b) = dot(a,b) / (||a|| × ||b||)", "Use math.sqrt for norms.", "Round to 5 decimal places."],
    "description": "## Cosine Similarity\n\nMeasure the cosine angle between two vectors — the core operation in every vector database.\n\n### Formula\n`cos(a, b) = dot(a, b) / (||a|| × ||b||)`\n\n### Range: [-1, 1]\n- 1.0 → identical direction\n- 0.0 → orthogonal\n- -1.0 → opposite\n\nRound to **5 decimal places**.",
    "starter_code": "def cosine_similarity(a: list, b: list) -> float:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"cosine_similarity([1,0,0],[0,1,0])","expected_output":"0.0","is_hidden":False,"description":"Orthogonal"},
      {"id":2,"function_call":"cosine_similarity([1,1],[1,1])","expected_output":"1.0","is_hidden":False,"description":"Identical direction"},
      {"id":3,"function_call":"cosine_similarity([1,2,3],[4,5,6])","expected_output":"0.97463","is_hidden":False,"description":"General case"},
      {"id":4,"function_call":"cosine_similarity([1,0],[-1,0])","expected_output":"-1.0","is_hidden":True,"description":"Opposite direction"},
    ]
  },
  {
    "order_index": 3,
    "title": "Cross-Entropy Loss",
    "slug": "cross-entropy-loss",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Math", "Loss Functions", "Training"],
    "companies": ["Google", "Meta", "Nvidia"],
    "hints": ["loss = -Σ y_true * log(y_pred)", "Clip predictions to avoid log(0).", "Round to 5 decimal places."],
    "description": "## Cross-Entropy Loss\n\nCompute the cross-entropy loss between true labels and predicted probabilities.\n\n### Formula\n`loss = -Σ y_true[i] * log(y_pred[i])`\n\n### Example\n```\ny_true = [0, 1, 0]\ny_pred = [0.1, 0.8, 0.1]\nloss = -(0*log(0.1) + 1*log(0.8) + 0*log(0.1)) = 0.22314\n```\n\nRound to **5 decimal places**.",
    "starter_code": "def cross_entropy_loss(y_true: list, y_pred: list) -> float:\n    # y_true: one-hot encoded labels\n    # y_pred: predicted probabilities\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"cross_entropy_loss([0,1,0],[0.1,0.8,0.1])","expected_output":"0.22314","is_hidden":False,"description":"Basic 3-class"},
      {"id":2,"function_call":"cross_entropy_loss([1,0],[0.9,0.1])","expected_output":"0.10536","is_hidden":False,"description":"Binary correct"},
      {"id":3,"function_call":"cross_entropy_loss([1,0],[0.5,0.5])","expected_output":"0.69315","is_hidden":True,"description":"Uncertain prediction"},
      {"id":4,"function_call":"cross_entropy_loss([0,0,1],[0.1,0.1,0.8])","expected_output":"0.22314","is_hidden":True,"description":"Third class true"},
    ]
  },
  {
    "order_index": 4,
    "title": "Sigmoid Function",
    "slug": "sigmoid-function",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Math", "Activation Functions"],
    "companies": ["Google", "Meta"],
    "hints": ["sigmoid(x) = 1 / (1 + exp(-x))", "Round to 5 decimal places."],
    "description": "## Sigmoid Function\n\nImplement the sigmoid activation function, used for binary classification and gating in LSTMs.\n\n### Formula\n`σ(x) = 1 / (1 + e^(-x))`\n\n### Properties\n- Output range: (0, 1)\n- σ(0) = 0.5\n- σ(-x) = 1 - σ(x)\n\nRound to **5 decimal places**.",
    "starter_code": "def sigmoid(x: float) -> float:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"sigmoid(0)","expected_output":"0.5","is_hidden":False,"description":"Zero input"},
      {"id":2,"function_call":"sigmoid(1)","expected_output":"0.73106","is_hidden":False,"description":"Positive input"},
      {"id":3,"function_call":"sigmoid(-1)","expected_output":"0.26894","is_hidden":False,"description":"Negative input"},
      {"id":4,"function_call":"sigmoid(10)","expected_output":"0.9999546","is_hidden":True,"description":"Large positive"},
    ]
  },
  {
    "order_index": 5,
    "title": "Euclidean Distance",
    "slug": "euclidean-distance",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Math", "Distance", "KNN"],
    "companies": ["Google", "Amazon"],
    "hints": ["dist = sqrt(sum((a[i] - b[i])^2))", "Round to 5 decimal places."],
    "description": "## Euclidean Distance\n\nCompute the L2 distance between two vectors. Used in KNN, clustering, and anomaly detection.\n\n### Formula\n`d(a, b) = √Σ(aᵢ - bᵢ)²`\n\n### Example\n```\na = [1, 2, 3], b = [4, 5, 6]\nd = sqrt((1-4)² + (2-5)² + (3-6)²) = sqrt(27) ≈ 5.19615\n```\n\nRound to **5 decimal places**.",
    "starter_code": "def euclidean_distance(a: list, b: list) -> float:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"euclidean_distance([0,0],[3,4])","expected_output":"5.0","is_hidden":False,"description":"3-4-5 triangle"},
      {"id":2,"function_call":"euclidean_distance([1,2,3],[4,5,6])","expected_output":"5.19615","is_hidden":False,"description":"3D vectors"},
      {"id":3,"function_call":"euclidean_distance([1,1],[1,1])","expected_output":"0.0","is_hidden":False,"description":"Same point"},
      {"id":4,"function_call":"euclidean_distance([0],[5])","expected_output":"5.0","is_hidden":True,"description":"1D"},
    ]
  },
  {
    "order_index": 6,
    "title": "Gradient Descent Step",
    "slug": "gradient-descent-step",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Optimization", "Training", "Math"],
    "companies": ["Google", "OpenAI", "Meta"],
    "hints": ["new_weight = weight - learning_rate * gradient", "Round to 5 decimal places."],
    "description": "## Gradient Descent Step\n\nImplement a single gradient descent update for a list of weights.\n\n### Formula\n`w_new = w - lr * gradient`\n\n### Example\n```\nweights  = [0.5, -0.3, 0.8]\ngradients= [0.1, -0.2, 0.05]\nlr = 0.1\nnew      = [0.49, -0.28, 0.795]\n```\n\nRound each weight to **5 decimal places**.",
    "starter_code": "def gradient_descent_step(weights: list, gradients: list, lr: float) -> list:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"gradient_descent_step([0.5,-0.3,0.8],[0.1,-0.2,0.05],0.1)","expected_output":"[0.49, -0.28, 0.795]","is_hidden":False,"description":"Basic step"},
      {"id":2,"function_call":"gradient_descent_step([1.0],[0.5],0.01)","expected_output":"[0.995]","is_hidden":False,"description":"Small learning rate"},
      {"id":3,"function_call":"gradient_descent_step([0.0,0.0],[0.0,0.0],0.1)","expected_output":"[0.0, 0.0]","is_hidden":True,"description":"Zero gradients"},
      {"id":4,"function_call":"gradient_descent_step([2.0,-1.0],[1.0,-1.0],0.5)","expected_output":"[1.5, -0.5]","is_hidden":True,"description":"Large step"},
    ]
  },
  {
    "order_index": 7,
    "title": "TF-IDF Score",
    "slug": "tfidf-score",
    "difficulty": "Medium",
    "topic": "NLP",
    "tags": ["NLP", "Information Retrieval", "Math"],
    "companies": ["Google", "Amazon", "Microsoft"],
    "hints": ["TF(t,d) = count(t in d) / len(d)", "IDF(t) = log(N / df(t))", "TF-IDF = TF * IDF, round to 5 decimal places."],
    "description": "## TF-IDF Score\n\nCompute the TF-IDF score for a term in a document.\n\n### Formulas\n- **TF(t, d)** = count of term t in doc d / total terms in d\n- **IDF(t)** = log(N / df(t))  where N = total docs, df = docs containing t\n- **TF-IDF** = TF × IDF\n\n### Example\n```\nterm = 'cat'\ndoc = ['cat','sat','cat','mat']\nall_docs = [['cat','sat'],['dog','ran'],['cat','mat']]\nTF = 2/4 = 0.5\nIDF = log(3/2) = 0.40546\nTF-IDF = 0.20273\n```\n\nUse natural log. Round to **5 decimal places**.",
    "starter_code": "import math\n\ndef tfidf(term: str, document: list, all_documents: list) -> float:\n    \"\"\"\n    term: the word to score\n    document: list of words in the current document\n    all_documents: list of documents (each a list of words)\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"tfidf('cat',['cat','sat','cat','mat'],[['cat','sat'],['dog','ran'],['cat','mat']])","expected_output":"0.20273","is_hidden":False,"description":"Term appears in 2 of 3 docs"},
      {"id":2,"function_call":"tfidf('dog',['dog','ran'],[['cat','sat'],['dog','ran'],['cat','mat']])","expected_output":"0.54931","is_hidden":False,"description":"Rare term"},
      {"id":3,"function_call":"tfidf('cat',['cat','cat','cat'],[['cat'],['cat'],['cat']])","expected_output":"0.0","is_hidden":True,"description":"Term in all docs: IDF=0"},
      {"id":4,"function_call":"tfidf('ml',['ml','ai','ml'],[['ml','ai'],['python','data'],['ai','ml']])","expected_output":"0.27031","is_hidden":True,"description":"Medium frequency"},
    ]
  },
  {
    "order_index": 8,
    "title": "KNN Classifier",
    "slug": "knn-classifier",
    "difficulty": "Medium",
    "topic": "Classical ML",
    "tags": ["KNN", "Classification", "Distance"],
    "companies": ["Amazon", "Google", "Netflix"],
    "hints": ["Compute Euclidean distance from query to all training points.", "Sort by distance, take k nearest neighbours.", "Return the most common label among k neighbours."],
    "description": "## K-Nearest Neighbours Classifier\n\nClassify a point based on the majority label among its k nearest neighbours.\n\n### Steps\n1. Compute distance from query point to all training points\n2. Select the k points with smallest distance\n3. Return the most common label (majority vote)\n\n### Example\n```\ntrain_X = [[1,1],[2,2],[5,5],[6,6]]\ntrain_y = [0,    0,    1,    1   ]\nquery   = [3,3], k=3\nDistances: [2.83, 1.41, 2.83, 4.24]\n3 nearest: indices [1,0,2] → labels [0,0,1] → majority = 0\n```",
    "starter_code": "def knn_classify(train_X: list, train_y: list, query: list, k: int) -> int:\n    \"\"\"\n    train_X: list of training vectors\n    train_y: list of integer labels\n    query: vector to classify\n    k: number of neighbours\n    Returns: predicted label (int)\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"knn_classify([[1,1],[2,2],[5,5],[6,6]],[0,0,1,1],[3,3],3)","expected_output":"0","is_hidden":False,"description":"Majority class 0"},
      {"id":2,"function_call":"knn_classify([[1,1],[2,2],[5,5],[6,6]],[0,0,1,1],[4,4],1)","expected_output":"1","is_hidden":False,"description":"Nearest is class 1"},
      {"id":3,"function_call":"knn_classify([[0],[1],[2],[3]],[0,0,1,1],[1.4],1)","expected_output":"0","is_hidden":True,"description":"1D nearest neighbour"},
      {"id":4,"function_call":"knn_classify([[1,1],[9,9],[5,5]],[0,1,0],[4,4],3)","expected_output":"0","is_hidden":True,"description":"Tie broken by count"},
    ]
  },
  {
    "order_index": 9,
    "title": "Tokenise Text (Word Level)",
    "slug": "tokenise-text",
    "difficulty": "Easy",
    "topic": "NLP",
    "tags": ["NLP", "Tokenization", "LLM"],
    "companies": ["OpenAI", "Hugging Face"],
    "hints": ["Lowercase the text first.", "Split on whitespace.", "Remove punctuation from each token."],
    "description": "## Word-Level Tokeniser\n\nTokenise a string into lowercase words, removing punctuation.\n\n### Rules\n1. Convert to lowercase\n2. Remove all punctuation characters (`.,!?;:'\\\"-`)\n3. Split on whitespace\n4. Remove empty strings\n\n### Example\n```\nInput:  'Hello, world! This is NLP.'\nOutput: ['hello', 'world', 'this', 'is', 'nlp']\n```",
    "starter_code": "def tokenise(text: str) -> list:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"tokenise('Hello, world! This is NLP.')","expected_output":"['hello', 'world', 'this', 'is', 'nlp']","is_hidden":False,"description":"Basic sentence"},
      {"id":2,"function_call":"tokenise('AI/ML is great')","expected_output":"['ai/ml', 'is', 'great']","is_hidden":False,"description":"Slash not removed"},
      {"id":3,"function_call":"tokenise('one two  three')","expected_output":"['one', 'two', 'three']","is_hidden":True,"description":"Multiple spaces"},
      {"id":4,"function_call":"tokenise('RAG, fine-tuning, and LoRA!')","expected_output":"['rag', 'fine-tuning', 'and', 'lora']","is_hidden":True,"description":"Hyphens preserved"},
    ]
  },
  {
    "order_index": 10,
    "title": "Precision, Recall, F1",
    "slug": "precision-recall-f1",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Evaluation", "Classification", "Metrics"],
    "companies": ["Google", "Meta", "Amazon"],
    "hints": ["Precision = TP / (TP + FP)", "Recall = TP / (TP + FN)", "F1 = 2 * P * R / (P + R)"],
    "description": "## Precision, Recall & F1 Score\n\nGiven a list of true labels and predicted labels, compute Precision, Recall, and F1 for the **positive class (1)**.\n\n### Formulas\n- TP = predicted 1, actual 1\n- FP = predicted 1, actual 0\n- FN = predicted 0, actual 1\n- Precision = TP / (TP + FP)\n- Recall = TP / (TP + FN)\n- F1 = 2 * Precision * Recall / (Precision + Recall)\n\nReturn a tuple **(precision, recall, f1)** each rounded to **5 decimal places**.",
    "starter_code": "def precision_recall_f1(y_true: list, y_pred: list) -> tuple:\n    # Returns (precision, recall, f1) each rounded to 5 decimal places\n    pass",
    "test_cases": [
      {"id":1,"function_call":"precision_recall_f1([1,1,0,0],[1,0,1,0])","expected_output":"(0.5, 0.5, 0.5)","is_hidden":False,"description":"Equal TP FP FN"},
      {"id":2,"function_call":"precision_recall_f1([1,1,1],[1,1,1])","expected_output":"(1.0, 1.0, 1.0)","is_hidden":False,"description":"Perfect prediction"},
      {"id":3,"function_call":"precision_recall_f1([1,0,1,0,1],[1,1,1,0,0])","expected_output":"(0.66667, 0.66667, 0.66667)","is_hidden":True,"description":"Mixed"},
      {"id":4,"function_call":"precision_recall_f1([0,0,0],[0,0,0])","expected_output":"(0.0, 0.0, 0.0)","is_hidden":True,"description":"No positives"},
    ]
  },
  {
    "order_index": 11,
    "title": "Dot Product Attention",
    "slug": "dot-product-attention",
    "difficulty": "Medium",
    "topic": "Transformers",
    "tags": ["Transformers", "Attention", "LLM"],
    "companies": ["Google", "OpenAI", "Meta"],
    "hints": ["scores = dot(Q, K^T) / sqrt(d_k)", "Apply softmax to scores.", "output = scores @ V", "Round final output to 5 decimal places."],
    "description": "## Scaled Dot-Product Attention\n\nImplement the core attention operation used in transformers.\n\n### Formula\n`Attention(Q, K, V) = softmax(QKᵀ / √dₖ) × V`\n\nWhere dₖ is the dimension of keys.\n\n### Input\n- Q: query matrix (n_q × d_k)\n- K: key matrix (n_k × d_k)\n- V: value matrix (n_k × d_v)\n\n### Output\nMatrix of shape (n_q × d_v), each row rounded to 5 decimal places.\n\n### Example\n```\nQ = [[1,0]], K = [[1,0],[0,1]], V = [[1,0],[0,1]]\nscores = [[1,0]] / sqrt(2) → softmax → [0.73106, 0.26894]\noutput = [[0.73106, 0.26894]]\n```",
    "starter_code": "import math\n\ndef dot_product_attention(Q: list, K: list, V: list) -> list:\n    \"\"\"\n    Q: list of query vectors (n_q x d_k)\n    K: list of key vectors (n_k x d_k)\n    V: list of value vectors (n_k x d_v)\n    Returns: output matrix (n_q x d_v)\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"dot_product_attention([[1,0]],[[1,0],[0,1]],[[1,0],[0,1]])","expected_output":"[[0.73106, 0.26894]]","is_hidden":False,"description":"Single query"},
      {"id":2,"function_call":"dot_product_attention([[1,0],[0,1]],[[1,0],[0,1]],[[2,0],[0,2]])","expected_output":"[[1.46211, 0.53789], [0.53789, 1.46211]]","is_hidden":False,"description":"Two queries"},
      {"id":3,"function_call":"dot_product_attention([[0,0]],[[1,0],[0,1]],[[1,0],[0,1]])","expected_output":"[[0.5, 0.5]]","is_hidden":True,"description":"Zero query"},
    ]
  },
  {
    "order_index": 12,
    "title": "Batch Normalisation",
    "slug": "batch-normalisation",
    "difficulty": "Medium",
    "topic": "Math",
    "tags": ["Deep Learning", "Normalisation", "Training"],
    "companies": ["Google", "Nvidia", "Meta"],
    "hints": ["Compute mean and variance across the batch (axis=0).", "Normalise: x_hat = (x - mean) / sqrt(var + eps)", "Apply scale and shift: y = gamma * x_hat + beta"],
    "description": "## Batch Normalisation\n\nNormalise a batch of activations using learnable parameters gamma and beta.\n\n### Formula\n1. μ = mean of batch\n2. σ² = variance of batch\n3. x̂ = (x - μ) / √(σ² + ε)\n4. y = γ × x̂ + β\n\n### Input\n- batch: list of values for a single feature across the batch\n- gamma (γ): scale parameter\n- beta (β): shift parameter\n- eps: small constant for numerical stability (default 1e-8)\n\nRound each output to **5 decimal places**.",
    "starter_code": "import math\n\ndef batch_norm(batch: list, gamma: float, beta: float, eps: float = 1e-8) -> list:\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"batch_norm([2.0,4.0,6.0,8.0],1.0,0.0)","expected_output":"[-1.34164, -0.4472, 0.4472, 1.34164]","is_hidden":False,"description":"Unit scale zero shift"},
      {"id":2,"function_call":"batch_norm([1.0,1.0,1.0],1.0,0.0)","expected_output":"[0.0, 0.0, 0.0]","is_hidden":False,"description":"Constant input"},
      {"id":3,"function_call":"batch_norm([0.0,2.0,4.0],2.0,1.0)","expected_output":"[-1.44949, 1.0, 3.44949]","is_hidden":True,"description":"Scale=2 beta=1"},
    ]
  },
  {
    "order_index": 13,
    "title": "Word Frequency Counter",
    "slug": "word-frequency-counter",
    "difficulty": "Easy",
    "topic": "NLP",
    "tags": ["NLP", "Python", "Data Processing"],
    "companies": ["Amazon", "Google"],
    "hints": ["Lowercase all words.", "Split on whitespace.", "Count occurrences using a dictionary."],
    "description": "## Word Frequency Counter\n\nCount the frequency of each word in a text and return the top-k most frequent words.\n\n### Rules\n1. Convert to lowercase, split on whitespace\n2. Remove punctuation (`.,!?;:`)\n3. Count each word's frequency\n4. Return top-k words as a list of (word, count) tuples, sorted by count descending, then alphabetically for ties\n\n### Example\n```\ntext = 'the cat sat on the mat the cat'\nk = 2\nOutput: [('the', 3), ('cat', 2)]\n```",
    "starter_code": "def top_k_words(text: str, k: int) -> list:\n    # Returns list of (word, count) tuples, top k by frequency\n    pass",
    "test_cases": [
      {"id":1,"function_call":"top_k_words('the cat sat on the mat the cat',2)","expected_output":"[('the', 3), ('cat', 2)]","is_hidden":False,"description":"Top 2 words"},
      {"id":2,"function_call":"top_k_words('ai ml ai dl ai ml',3)","expected_output":"[('ai', 3), ('ml', 2), ('dl', 1)]","is_hidden":False,"description":"Three distinct"},
      {"id":3,"function_call":"top_k_words('hello hello world',1)","expected_output":"[('hello', 2)]","is_hidden":True,"description":"Top 1"},
    ]
  },
  {
    "order_index": 14,
    "title": "Mean Squared Error",
    "slug": "mean-squared-error",
    "difficulty": "Easy",
    "topic": "Math",
    "tags": ["Regression", "Loss Functions", "Math"],
    "companies": ["Google", "Amazon"],
    "hints": ["MSE = (1/n) * Σ(y_pred - y_true)²", "Round to 5 decimal places."],
    "description": "## Mean Squared Error\n\nCompute the mean squared error between predicted and true values.\n\n### Formula\n`MSE = (1/n) × Σ(ŷᵢ - yᵢ)²`\n\n### Example\n```\ny_true = [3, -0.5, 2, 7]\ny_pred = [2.5, 0.0, 2, 8]\nMSE = ((0.5² + 0.5² + 0² + 1²) / 4) = 0.375\n```\n\nRound to **5 decimal places**.",
    "starter_code": "def mse(y_true: list, y_pred: list) -> float:\n    pass",
    "test_cases": [
      {"id":1,"function_call":"mse([3,-0.5,2,7],[2.5,0.0,2,8])","expected_output":"0.375","is_hidden":False,"description":"Mixed errors"},
      {"id":2,"function_call":"mse([1,2,3],[1,2,3])","expected_output":"0.0","is_hidden":False,"description":"Perfect prediction"},
      {"id":3,"function_call":"mse([0,0],[1,1])","expected_output":"1.0","is_hidden":True,"description":"Unit errors"},
      {"id":4,"function_call":"mse([5],[2])","expected_output":"9.0","is_hidden":True,"description":"Single value"},
    ]
  },
  {
    "order_index": 15,
    "title": "One-Hot Encoding",
    "slug": "one-hot-encoding",
    "difficulty": "Easy",
    "topic": "Classical ML",
    "tags": ["Data Processing", "Encoding", "Features"],
    "companies": ["Google", "Amazon", "Meta"],
    "hints": ["Create a list of zeros of length num_classes.", "Set index of the class to 1."],
    "description": "## One-Hot Encoding\n\nConvert a list of integer class labels into one-hot encoded vectors.\n\n### Example\n```\nlabels     = [0, 2, 1]\nnum_classes = 3\nOutput: [[1,0,0], [0,0,1], [0,1,0]]\n```\n\nEach output vector has length `num_classes` with a 1 at the label's index.",
    "starter_code": "def one_hot_encode(labels: list, num_classes: int) -> list:\n    # Returns list of one-hot vectors\n    pass",
    "test_cases": [
      {"id":1,"function_call":"one_hot_encode([0,2,1],3)","expected_output":"[[1, 0, 0], [0, 0, 1], [0, 1, 0]]","is_hidden":False,"description":"Basic 3-class"},
      {"id":2,"function_call":"one_hot_encode([0,1],2)","expected_output":"[[1, 0], [0, 1]]","is_hidden":False,"description":"Binary"},
      {"id":3,"function_call":"one_hot_encode([3],4)","expected_output":"[[0, 0, 0, 1]]","is_hidden":True,"description":"Last class"},
      {"id":4,"function_call":"one_hot_encode([0,0],3)","expected_output":"[[1, 0, 0], [1, 0, 0]]","is_hidden":True,"description":"Repeated label"},
    ]
  },
  {
    "order_index": 16,
    "title": "Positional Encoding",
    "slug": "positional-encoding",
    "difficulty": "Medium",
    "topic": "Transformers",
    "tags": ["Transformers", "Positional Encoding", "LLM"],
    "companies": ["Google", "OpenAI"],
    "hints": ["PE(pos, 2i) = sin(pos / 10000^(2i/d_model))", "PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))", "Round to 5 decimal places."],
    "description": "## Sinusoidal Positional Encoding\n\nGenerate the positional encoding vector for a single position in a transformer.\n\n### Formula\n- `PE[2i]   = sin(pos / 10000^(2i / d_model))`\n- `PE[2i+1] = cos(pos / 10000^(2i / d_model))`\n\n### Example\n```\npositional_encoding(pos=0, d_model=4)\n→ [sin(0), cos(0), sin(0), cos(0)]\n→ [0.0, 1.0, 0.0, 1.0]\n```\n\nRound each value to **5 decimal places**.",
    "starter_code": "import math\n\ndef positional_encoding(pos: int, d_model: int) -> list:\n    \"\"\"\n    pos: position index (0-based)\n    d_model: embedding dimension (even number)\n    Returns: list of d_model floats\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"positional_encoding(0,4)","expected_output":"[0.0, 1.0, 0.0, 1.0]","is_hidden":False,"description":"Position 0"},
      {"id":2,"function_call":"positional_encoding(1,4)","expected_output":"[0.84147, 0.54030, 0.00999, 0.99995]","is_hidden":False,"description":"Position 1"},
      {"id":3,"function_call":"positional_encoding(0,2)","expected_output":"[0.0, 1.0]","is_hidden":True,"description":"Minimal d_model"},
    ]
  },
  {
    "order_index": 17,
    "title": "Label Encoding",
    "slug": "label-encoding",
    "difficulty": "Easy",
    "topic": "Classical ML",
    "tags": ["Data Processing", "Encoding", "Features"],
    "companies": ["Amazon", "Google"],
    "hints": ["Assign integer 0, 1, 2... to unique categories in sorted order.", "Return the integer for each input label."],
    "description": "## Label Encoding\n\nConvert categorical string labels to integer indices.\n\n### Rules\n1. Find all unique labels\n2. Sort them alphabetically\n3. Assign index 0, 1, 2... to each\n4. Return the encoded list\n\n### Example\n```\nlabels = ['cat', 'dog', 'cat', 'bird']\nOutput: [1, 2, 1, 0]  (bird=0, cat=1, dog=2)\n```",
    "starter_code": "def label_encode(labels: list) -> list:\n    # Returns list of integer-encoded labels\n    pass",
    "test_cases": [
      {"id":1,"function_call":"label_encode(['cat','dog','cat','bird'])","expected_output":"[1, 2, 1, 0]","is_hidden":False,"description":"3 classes"},
      {"id":2,"function_call":"label_encode(['a','b','a','c','b'])","expected_output":"[0, 1, 0, 2, 1]","is_hidden":False,"description":"Alphabetical order"},
      {"id":3,"function_call":"label_encode(['z','a','m'])","expected_output":"[2, 0, 1]","is_hidden":True,"description":"Reverse order"},
      {"id":4,"function_call":"label_encode(['x'])","expected_output":"[0]","is_hidden":True,"description":"Single label"},
    ]
  },
  {
    "order_index": 18,
    "title": "Min-Max Normalisation",
    "slug": "min-max-normalisation",
    "difficulty": "Easy",
    "topic": "Classical ML",
    "tags": ["Data Processing", "Normalisation", "Features"],
    "companies": ["Google", "Amazon", "Meta"],
    "hints": ["x_norm = (x - min) / (max - min)", "If max == min, return all zeros.", "Round to 5 decimal places."],
    "description": "## Min-Max Normalisation\n\nScale a list of values to the range [0, 1].\n\n### Formula\n`x_norm = (x - x_min) / (x_max - x_min)`\n\nIf all values are equal, return a list of zeros.\n\nRound to **5 decimal places**.",
    "starter_code": "def min_max_normalise(values: list) -> list:\n    # Scale values to [0, 1]\n    pass",
    "test_cases": [
      {"id":1,"function_call":"min_max_normalise([0,5,10])","expected_output":"[0.0, 0.5, 1.0]","is_hidden":False,"description":"Basic scaling"},
      {"id":2,"function_call":"min_max_normalise([3,3,3])","expected_output":"[0.0, 0.0, 0.0]","is_hidden":False,"description":"All same value"},
      {"id":3,"function_call":"min_max_normalise([1,2,3,4,5])","expected_output":"[0.0, 0.25, 0.5, 0.75, 1.0]","is_hidden":True,"description":"Sequential values"},
      {"id":4,"function_call":"min_max_normalise([-10,0,10])","expected_output":"[0.0, 0.5, 1.0]","is_hidden":True,"description":"Negative values"},
    ]
  },
  {
    "order_index": 19,
    "title": "Perplexity",
    "slug": "perplexity",
    "difficulty": "Medium",
    "topic": "NLP",
    "tags": ["NLP", "LLM", "Evaluation"],
    "companies": ["OpenAI", "Google", "Meta"],
    "hints": ["perplexity = exp(-(1/N) * sum(log(p_i)))", "Use natural log.", "Round to 5 decimal places."],
    "description": "## Perplexity\n\nCompute the perplexity of a language model — a measure of how well the model predicts a sequence.\n\n### Formula\n`PP = exp(-(1/N) × Σ log(p(wᵢ)))`\n\nWhere p(wᵢ) is the model's predicted probability for each token.\n\n**Lower perplexity = better model.**\n\n### Example\n```\nprobs = [0.5, 0.3, 0.8]\nPP = exp(-(log(0.5)+log(0.3)+log(0.8))/3) ≈ 3.17578\n```\n\nRound to **5 decimal places**.",
    "starter_code": "import math\n\ndef perplexity(probabilities: list) -> float:\n    \"\"\"\n    probabilities: list of token probabilities predicted by the model\n    Returns: perplexity score\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"perplexity([0.5,0.3,0.8])","expected_output":"3.17578","is_hidden":False,"description":"Mixed probabilities"},
      {"id":2,"function_call":"perplexity([1.0,1.0,1.0])","expected_output":"1.0","is_hidden":False,"description":"Perfect model"},
      {"id":3,"function_call":"perplexity([0.1,0.1,0.1])","expected_output":"10.0","is_hidden":True,"description":"Low probability model"},
      {"id":4,"function_call":"perplexity([0.5,0.5])","expected_output":"2.0","is_hidden":True,"description":"Binary uniform"},
    ]
  },
  {
    "order_index": 20,
    "title": "K-Means Centroid Update",
    "slug": "kmeans-centroid-update",
    "difficulty": "Medium",
    "topic": "Classical ML",
    "tags": ["Clustering", "K-Means", "Unsupervised"],
    "companies": ["Google", "Amazon", "Uber"],
    "hints": ["Group points by their assigned cluster.", "New centroid = mean of all points in that cluster.", "Round to 5 decimal places."],
    "description": "## K-Means Centroid Update\n\nImplement the centroid update step of K-Means clustering.\n\nGiven data points and their current cluster assignments, compute the new centroid for each cluster by averaging the points assigned to it.\n\n### Example\n```\npoints      = [[1,1],[2,2],[8,8],[9,9]]\nassignments = [0,    0,    1,    1   ]\nk = 2\nNew centroids: [[1.5, 1.5], [8.5, 8.5]]\n```\n\nRound each coordinate to **5 decimal places**.",
    "starter_code": "def update_centroids(points: list, assignments: list, k: int) -> list:\n    \"\"\"\n    points: list of data point vectors\n    assignments: list of cluster indices (0 to k-1) for each point\n    k: number of clusters\n    Returns: list of k new centroid vectors\n    \"\"\"\n    # Your code here\n    pass",
    "test_cases": [
      {"id":1,"function_call":"update_centroids([[1,1],[2,2],[8,8],[9,9]],[0,0,1,1],2)","expected_output":"[[1.5, 1.5], [8.5, 8.5]]","is_hidden":False,"description":"Two clusters"},
      {"id":2,"function_call":"update_centroids([[0,0],[4,4],[8,8]],[0,1,2],3)","expected_output":"[[0.0, 0.0], [4.0, 4.0], [8.0, 8.0]]","is_hidden":False,"description":"Three singleton clusters"},
      {"id":3,"function_call":"update_centroids([[1,2],[3,4],[5,6],[7,8]],[0,0,0,1],2)","expected_output":"[[3.0, 4.0], [7.0, 8.0]]","is_hidden":True,"description":"Unequal cluster sizes"},
    ]
  },
]

def upload_to_api(problems):
    """Upload code lab problems via the admin seed API."""
    # Use the existing seed endpoint which accepts ADMIN_PASSWORD
    import os
    admin_password = input("Enter your admin password: ").strip()

    resp = requests.post(
        f"{SITE_URL}/api/code-lab/seed",
        json={"password": admin_password, "problems": problems},
        timeout=60,
    )
    return resp.json()

def upload_direct(problems):
    """Upload directly via Supabase bulk-upload API."""
    resp = requests.post(
        f"{SITE_URL}/api/admin/bulk-upload",
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json={"type": "code_problems", "data": problems},
        timeout=60,
    )
    return resp.json()

if __name__ == "__main__":
    print(f"Code Lab Problems: {len(PROBLEMS)}")
    for p in PROBLEMS:
        tc = len(p["test_cases"])
        print(f"  [{p['difficulty']:6}] {p['title']} ({tc} test cases)")

    print(f"\nTotal: {len(PROBLEMS)} problems")
    print("\nUploading via bulk-upload API...")
    result = upload_direct(PROBLEMS)
    print(f"Result: {result}")
