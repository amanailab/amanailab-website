export interface TestCase {
  id: number
  function_call: string
  expected_output: string
  is_hidden: boolean
  description: string
}

export interface SeedProblem {
  title: string
  slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  topic: string
  tags: string[]
  description: string
  starter_code: string
  test_cases: TestCase[]
  hints: string[]
  companies: string[]
  order_index: number
}

export const SEED_PROBLEMS: SeedProblem[] = [
  // ── 1 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 1,
    title: 'Softmax Function',
    slug: 'softmax-function',
    difficulty: 'Easy',
    topic: 'Math',
    tags: ['Math', 'Probability', 'LLM'],
    companies: ['OpenAI', 'Google', 'Meta'],
    hints: [
      'Use math.exp() for the exponential function.',
      'Compute all e^x values first, then divide each by their sum.',
      'Round each output value to 5 decimal places.',
    ],
    description: `## Softmax Function

Convert a list of real numbers (logits) into a **probability distribution**.

### Formula
\`softmax(xᵢ) = exp(xᵢ) / Σ exp(xⱼ)\`

### Properties
- All outputs are in (0, 1)
- All outputs sum to exactly 1.0
- **Shift invariant**: softmax(x) == softmax(x + c)

### Example
\`\`\`
Input:  [1.0, 2.0, 3.0]
Output: [0.09003, 0.24473, 0.66524]
\`\`\`

### Constraints
- 1 ≤ len(logits) ≤ 100
- Round each value to **5 decimal places**`,
    starter_code: `def softmax(logits: list) -> list:
    """
    Convert logits to a probability distribution.

    Args:
        logits: list of floats
    Returns:
        list of probabilities summing to 1.0, rounded to 5 decimal places
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'softmax([1.0, 2.0, 3.0])',  expected_output: '[0.09003, 0.24473, 0.66524]', is_hidden: false, description: 'Basic 3-element' },
      { id: 2, function_call: 'softmax([0.0, 0.0, 0.0])',  expected_output: '[0.33333, 0.33333, 0.33333]', is_hidden: false, description: 'Uniform' },
      { id: 3, function_call: 'softmax([1.0])',             expected_output: '[1.0]',                       is_hidden: true,  description: 'Single element' },
      { id: 4, function_call: 'softmax([10.0, -10.0])',     expected_output: '[1.0, 0.0]',                  is_hidden: true,  description: 'Extreme values' },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 2,
    title: 'Cosine Similarity',
    slug: 'cosine-similarity',
    difficulty: 'Easy',
    topic: 'Vector DB',
    tags: ['Vector DB', 'Embeddings', 'Math'],
    companies: ['Pinecone', 'Weaviate', 'OpenAI'],
    hints: [
      'Cosine similarity = dot(a,b) / (||a|| × ||b||)',
      'Use math.sqrt() for the norm.',
      'Handle the zero-vector edge case.',
    ],
    description: `## Cosine Similarity

Measure the **cosine angle** between two vectors — the core operation behind every vector database and embedding search.

### Formula
\`cos(a, b) = dot(a, b) / (||a|| × ||b||)\`

### Range: [-1, 1]
- 1.0  → identical direction
- 0.0  → orthogonal (unrelated)
- -1.0 → opposite direction

### Example
\`\`\`
cosine_similarity([1, 0, 0], [0, 1, 0])  →  0.0
cosine_similarity([1, 1],    [1, 1])     →  1.0
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def cosine_similarity(a: list, b: list) -> float:
    """
    Compute cosine similarity between two vectors.

    Args:
        a, b: lists of floats of equal length
    Returns:
        float in [-1, 1], rounded to 5 decimal places
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'cosine_similarity([1,0,0], [0,1,0])',  expected_output: '0.0',     is_hidden: false, description: 'Orthogonal' },
      { id: 2, function_call: 'cosine_similarity([1,1],   [1,1])',    expected_output: '1.0',     is_hidden: false, description: 'Identical' },
      { id: 3, function_call: 'cosine_similarity([1,2,3], [4,5,6])',  expected_output: '0.97463', is_hidden: false, description: 'General case' },
      { id: 4, function_call: 'cosine_similarity([1,0],   [-1,0])',   expected_output: '-1.0',    is_hidden: true,  description: 'Opposite' },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 3,
    title: 'Cross-Entropy Loss',
    slug: 'cross-entropy-loss',
    difficulty: 'Easy',
    topic: 'Math',
    tags: ['Math', 'Loss Functions', 'Training'],
    companies: ['Google', 'Meta', 'Nvidia'],
    hints: [
      'CE = -sum(y_true * log(y_pred))',
      'Only the index where y_true=1 contributes (one-hot encoding).',
      'Use math.log() for natural log.',
    ],
    description: `## Cross-Entropy Loss

The standard loss function for **classification** tasks. Measures how well predicted probabilities match the true label.

### Formula
\`CE = -Σ y_true[i] × log(y_pred[i])\`

For one-hot y_true this simplifies to:
\`CE = -log(y_pred[correct_class])\`

### Example
\`\`\`
cross_entropy([0,1,0], [0.1, 0.8, 0.1])  →  0.22314
# = -log(0.8) = 0.22314
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def cross_entropy(y_true: list, y_pred: list) -> float:
    """
    Compute cross-entropy loss.

    Args:
        y_true: one-hot encoded true labels [0, 1, 0]
        y_pred: predicted probabilities [0.1, 0.8, 0.1]
    Returns:
        float loss value, rounded to 5 decimal places
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'cross_entropy([0,1,0], [0.1,0.8,0.1])', expected_output: '0.22314', is_hidden: false, description: 'Standard case' },
      { id: 2, function_call: 'cross_entropy([1,0,0], [0.9,0.05,0.05])', expected_output: '0.10536', is_hidden: false, description: 'Confident correct' },
      { id: 3, function_call: 'cross_entropy([0,1], [0.01,0.99])',  expected_output: '0.01005', is_hidden: true, description: 'Very confident' },
      { id: 4, function_call: 'cross_entropy([1,0], [0.5,0.5])',    expected_output: '0.69315', is_hidden: true, description: 'Uncertain' },
    ],
  },

  // ── 4 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 4,
    title: 'Sigmoid & Derivative',
    slug: 'sigmoid-derivative',
    difficulty: 'Easy',
    topic: 'Math',
    tags: ['Math', 'Activation', 'Backprop'],
    companies: ['Google', 'Meta'],
    hints: [
      'sigmoid(x) = 1 / (1 + e^(-x))',
      'sigmoid_derivative(x) = sigmoid(x) * (1 - sigmoid(x))',
    ],
    description: `## Sigmoid & Its Derivative

The **sigmoid** activation squashes any value into (0, 1). Its derivative is elegant and reuses the sigmoid output.

### Formulas
\`σ(x) = 1 / (1 + e^(-x))\`
\`σ'(x) = σ(x) × (1 - σ(x))\`

### Example
\`\`\`
sigmoid(0)  →  0.5
sigmoid(1)  →  0.73106
sigmoid_derivative(0)  →  0.25
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def sigmoid(x: float) -> float:
    """Sigmoid activation: 1 / (1 + e^(-x))"""
    # Your code here
    pass

def sigmoid_derivative(x: float) -> float:
    """Derivative of sigmoid at x: sigmoid(x) * (1 - sigmoid(x))"""
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'sigmoid(0)',              expected_output: '0.5',     is_hidden: false, description: 'Center point' },
      { id: 2, function_call: 'sigmoid(1)',              expected_output: '0.73106', is_hidden: false, description: 'Positive' },
      { id: 3, function_call: 'sigmoid_derivative(0)',   expected_output: '0.25',    is_hidden: false, description: 'Max derivative at 0' },
      { id: 4, function_call: 'sigmoid(-2)',             expected_output: '0.11920', is_hidden: true,  description: 'Negative' },
      { id: 5, function_call: 'sigmoid_derivative(2)',   expected_output: '0.10499', is_hidden: true,  description: 'Derivative positive' },
    ],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 5,
    title: 'ReLU & Leaky ReLU',
    slug: 'relu-leaky-relu',
    difficulty: 'Easy',
    topic: 'Math',
    tags: ['Math', 'Activation', 'Deep Learning'],
    companies: ['Google', 'Meta', 'Nvidia'],
    hints: [
      'ReLU: max(0, x)',
      'Leaky ReLU: x if x > 0 else alpha * x',
      'Default alpha for Leaky ReLU is 0.01',
    ],
    description: `## ReLU & Leaky ReLU

**ReLU** (Rectified Linear Unit) is the most common activation in deep networks. **Leaky ReLU** fixes the "dying ReLU" problem by allowing a small negative gradient.

### Formulas
\`relu(x) = max(0, x)\`
\`leaky_relu(x, alpha=0.01) = x if x > 0 else alpha * x\`

### Example
\`\`\`
relu([-2, -1, 0, 1, 2])        →  [0, 0, 0, 1, 2]
leaky_relu([-2, 0, 2])         →  [-0.02, 0, 2]
\`\`\``,
    starter_code: `def relu(values: list) -> list:
    """Apply ReLU element-wise: max(0, x)"""
    # Your code here
    pass

def leaky_relu(values: list, alpha: float = 0.01) -> list:
    """Apply Leaky ReLU element-wise: x if x > 0 else alpha * x"""
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'relu([-2,-1,0,1,2])',           expected_output: '[0, 0, 0, 1, 2]',      is_hidden: false, description: 'Basic ReLU' },
      { id: 2, function_call: 'leaky_relu([-2,0,2])',           expected_output: '[-0.02, 0, 2]',         is_hidden: false, description: 'Leaky ReLU default alpha' },
      { id: 3, function_call: 'leaky_relu([-10,5], 0.1)',       expected_output: '[-1.0, 5]',             is_hidden: true,  description: 'Custom alpha' },
      { id: 4, function_call: 'relu([0.5, -0.5, 0.0])',         expected_output: '[0.5, 0, 0]',           is_hidden: true,  description: 'Float inputs' },
    ],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 6,
    title: 'Precision@K',
    slug: 'precision-at-k',
    difficulty: 'Easy',
    topic: 'RAG',
    tags: ['RAG', 'Evaluation', 'Retrieval'],
    companies: ['Pinecone', 'Cohere', 'Anthropic'],
    hints: [
      'Only consider the first k retrieved items.',
      'Count how many of those k items are in the relevant set.',
      'Divide by k.',
    ],
    description: `## Precision@K

A core RAG evaluation metric. Measures how many of the **top-K retrieved documents** are actually relevant.

### Formula
\`Precision@K = |relevant ∩ retrieved[:K]| / K\`

### Example
\`\`\`
relevant  = [1, 2, 3]
retrieved = [1, 4, 2, 5, 3]
K = 3  →  top-3 = [1, 4, 2]
relevant in top-3 = {1, 2}  →  2/3 = 0.66667
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def precision_at_k(relevant: list, retrieved: list, k: int) -> float:
    """
    Compute Precision@K.

    Args:
        relevant:  list of relevant document IDs
        retrieved: list of retrieved document IDs in rank order
        k:         cutoff rank
    Returns:
        float in [0, 1]
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'precision_at_k([1,2,3],[1,4,2,5,3],3)', expected_output: '0.66667', is_hidden: false, description: '2 of 3 relevant' },
      { id: 2, function_call: 'precision_at_k([1,2],[1,2,3,4,5],2)',   expected_output: '1.0',     is_hidden: false, description: 'Perfect top-2' },
      { id: 3, function_call: 'precision_at_k([1,2],[3,4,5],3)',        expected_output: '0.0',     is_hidden: true,  description: 'No relevant retrieved' },
      { id: 4, function_call: 'precision_at_k([1,2,3],[2,1,4,5,3],5)', expected_output: '0.6',     is_hidden: true,  description: '3 of 5' },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 7,
    title: 'Jaccard Similarity',
    slug: 'jaccard-similarity',
    difficulty: 'Easy',
    topic: 'NLP',
    tags: ['NLP', 'Similarity', 'Sets'],
    companies: ['Google', 'Amazon'],
    hints: [
      'Jaccard = |A ∩ B| / |A ∪ B|',
      'Use Python sets for intersection and union.',
    ],
    description: `## Jaccard Similarity

Measures overlap between two **sets**. Used in NLP for document similarity, deduplication, and MinHash LSH.

### Formula
\`J(A, B) = |A ∩ B| / |A ∪ B|\`

### Example
\`\`\`
jaccard([1,2,3], [2,3,4])  →  0.5
# Intersection: {2,3} → 2
# Union:        {1,2,3,4} → 4
# 2/4 = 0.5
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def jaccard_similarity(a: list, b: list) -> float:
    """
    Compute Jaccard similarity between two lists (treated as sets).

    Args:
        a, b: lists of elements
    Returns:
        float in [0, 1]
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'jaccard_similarity([1,2,3],[2,3,4])',        expected_output: '0.5',     is_hidden: false, description: 'Partial overlap' },
      { id: 2, function_call: 'jaccard_similarity([1,2],[1,2])',            expected_output: '1.0',     is_hidden: false, description: 'Identical' },
      { id: 3, function_call: 'jaccard_similarity([1,2],[3,4])',            expected_output: '0.0',     is_hidden: false, description: 'No overlap' },
      { id: 4, function_call: 'jaccard_similarity([1,2,3,4],[3,4,5,6])',   expected_output: '0.33333', is_hidden: true,  description: '2/6 overlap' },
    ],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 8,
    title: 'Temperature Scaling',
    slug: 'temperature-scaling',
    difficulty: 'Easy',
    topic: 'LLM',
    tags: ['LLM', 'Sampling', 'Probability'],
    companies: ['OpenAI', 'Anthropic', 'Mistral'],
    hints: [
      'Divide all logits by temperature before applying softmax.',
      'Temperature > 1 makes distribution more uniform (creative).',
      'Temperature < 1 makes distribution sharper (deterministic).',
    ],
    description: `## Temperature Scaling

Controls LLM **creativity vs determinism**. Temperature is applied before softmax during token sampling.

### Formula
\`temperature_scale(logits, T) = softmax(logits / T)\`

### Effect
- T = 1.0  → standard softmax (no change)
- T → 0    → argmax (always picks highest logit)
- T → ∞   → uniform distribution

### Example
\`\`\`
temperature_scale([1.0, 2.0, 3.0], 1.0)  →  [0.09003, 0.24473, 0.66524]
temperature_scale([1.0, 2.0, 3.0], 2.0)  →  [0.18632, 0.30720, 0.50648]
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def temperature_scale(logits: list, temperature: float) -> list:
    """
    Apply temperature scaling then softmax.

    Args:
        logits:      list of raw scores
        temperature: float > 0
    Returns:
        probability distribution
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'temperature_scale([1.0,2.0,3.0], 1.0)', expected_output: '[0.09003, 0.24473, 0.66524]', is_hidden: false, description: 'T=1 same as softmax' },
      { id: 2, function_call: 'temperature_scale([1.0,2.0,3.0], 2.0)', expected_output: '[0.18632, 0.3072, 0.50648]',  is_hidden: false, description: 'T=2 more uniform' },
      { id: 3, function_call: 'temperature_scale([0.0,0.0,0.0], 0.5)', expected_output: '[0.33333, 0.33333, 0.33333]', is_hidden: true,  description: 'Uniform input' },
    ],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────────
  {
    order_index: 9,
    title: 'Tokenize Text',
    slug: 'tokenize-text',
    difficulty: 'Easy',
    topic: 'NLP',
    tags: ['NLP', 'Tokenization', 'Preprocessing'],
    companies: ['OpenAI', 'HuggingFace', 'Google'],
    hints: [
      'Lowercase the text first.',
      'Remove punctuation characters: . , ! ? ; : " \'',
      'Split on whitespace and filter empty strings.',
    ],
    description: `## Tokenize Text

Implement a **basic whitespace tokenizer** — the foundation of NLP preprocessing.

### Rules
1. Lowercase the entire string
2. Remove punctuation: \`. , ! ? ; : " '\`
3. Split on whitespace
4. Remove empty strings

### Example
\`\`\`
tokenize("Hello, World!")       →  ["hello", "world"]
tokenize("The quick brown fox") →  ["the", "quick", "brown", "fox"]
tokenize("AI is great!")        →  ["ai", "is", "great"]
\`\`\``,
    starter_code: `def tokenize(text: str) -> list:
    """
    Tokenize text: lowercase, remove punctuation, split on whitespace.

    Args:
        text: input string
    Returns:
        list of token strings
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'tokenize("Hello, World!")',         expected_output: "['hello', 'world']",              is_hidden: false, description: 'Basic' },
      { id: 2, function_call: 'tokenize("The quick brown fox")',   expected_output: "['the', 'quick', 'brown', 'fox']", is_hidden: false, description: 'No punctuation' },
      { id: 3, function_call: 'tokenize("AI is great!")',          expected_output: "['ai', 'is', 'great']",            is_hidden: false, description: 'Exclamation' },
      { id: 4, function_call: 'tokenize("  spaces   here  ")',     expected_output: "['spaces', 'here']",               is_hidden: true,  description: 'Extra spaces' },
    ],
  },

  // ── 10 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 10,
    title: 'Layer Normalization',
    slug: 'layer-normalization',
    difficulty: 'Medium',
    topic: 'Transformers',
    tags: ['Transformers', 'Normalization', 'Deep Learning'],
    companies: ['OpenAI', 'Google', 'Meta'],
    hints: [
      'mean = sum(x) / len(x)',
      'variance = sum((xi - mean)^2) / len(x)',
      'normalized = (xi - mean) / sqrt(variance + epsilon)',
      'Use epsilon=1e-8 to avoid division by zero.',
    ],
    description: `## Layer Normalization

Used in every Transformer layer (GPT, BERT, LLaMA) to stabilize training. Normalizes across the **feature dimension** of a single sample.

### Formula
\`LayerNorm(x) = (x - μ) / √(σ² + ε)\`

Where μ = mean(x), σ² = variance(x), ε = 1e-8

### Example
\`\`\`
layer_norm([1.0, 2.0, 3.0])  →  [-1.22474, 0.0, 1.22474]
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def layer_norm(x: list, epsilon: float = 1e-8) -> list:
    """
    Apply Layer Normalization.

    Args:
        x:       list of floats (one layer's activations)
        epsilon: small value to prevent division by zero
    Returns:
        normalized list with mean≈0 and std≈1
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'layer_norm([1.0,2.0,3.0])',      expected_output: '[-1.22474, 0.0, 1.22474]',  is_hidden: false, description: 'Basic 3-element' },
      { id: 2, function_call: 'layer_norm([0.0,0.0,0.0])',      expected_output: '[0.0, 0.0, 0.0]',            is_hidden: false, description: 'All zeros' },
      { id: 3, function_call: 'layer_norm([4.0,4.0,4.0,4.0])', expected_output: '[0.0, 0.0, 0.0, 0.0]',       is_hidden: true,  description: 'Constant' },
      { id: 4, function_call: 'layer_norm([1.0,3.0,5.0,7.0])', expected_output: '[-1.34164, -0.44721, 0.44721, 1.34164]', is_hidden: true, description: '4-element' },
    ],
  },

  // ── 11 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 11,
    title: 'Top-K Indices',
    slug: 'top-k-indices',
    difficulty: 'Medium',
    topic: 'LLM',
    tags: ['LLM', 'Sampling', 'Decoding'],
    companies: ['OpenAI', 'Anthropic', 'Cohere'],
    hints: [
      'Sort by value descending, keeping track of original indices.',
      'Use enumerate() to pair values with their indices.',
      'Return only the indices (not the values).',
    ],
    description: `## Top-K Indices

Used in **LLM token sampling** — before sampling the next token, we restrict the vocabulary to only the top-K most likely tokens.

### Task
Given a list of logits, return the **indices** of the top-K highest values, ordered from highest to lowest.

### Example
\`\`\`
top_k_indices([5, 3, 1, 4, 2], k=3)  →  [0, 3, 1]
# Values: 5=idx0, 4=idx3, 3=idx1
\`\`\``,
    starter_code: `def top_k_indices(logits: list, k: int) -> list:
    """
    Return indices of the top-k highest values.

    Args:
        logits: list of floats
        k:      number of top elements to return
    Returns:
        list of k indices sorted by value descending
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'top_k_indices([5,3,1,4,2], 3)',    expected_output: '[0, 3, 1]', is_hidden: false, description: 'Basic top-3' },
      { id: 2, function_call: 'top_k_indices([1,2,3,4,5], 2)',    expected_output: '[4, 3]',    is_hidden: false, description: 'Ascending input' },
      { id: 3, function_call: 'top_k_indices([10,10,10], 2)',     expected_output: '[0, 1]',    is_hidden: true,  description: 'Tie-breaking (stable sort)' },
      { id: 4, function_call: 'top_k_indices([0.1,0.9,0.4], 1)', expected_output: '[1]',       is_hidden: true,  description: 'Top-1' },
    ],
  },

  // ── 12 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 12,
    title: 'Perplexity',
    slug: 'perplexity',
    difficulty: 'Medium',
    topic: 'LLM',
    tags: ['LLM', 'Evaluation', 'Metrics'],
    companies: ['OpenAI', 'Anthropic', 'Google'],
    hints: [
      'Perplexity = exp(-1/N × Σ log(p_i))',
      'Use math.log() for natural logarithm.',
      'Lower perplexity = better language model.',
    ],
    description: `## Perplexity

The standard metric for **evaluating language models**. Measures how surprised the model is by the text — lower is better.

### Formula
\`Perplexity = exp(-1/N × Σ log(p_i))\`

Where p_i is the model's assigned probability to the i-th token.

### Intuition
- Perplexity of 10 means the model is as confused as choosing uniformly among 10 options
- Perfect model: perplexity = 1.0

### Example
\`\`\`
perplexity([0.5, 0.5, 0.5, 0.5])  →  2.0
perplexity([1.0, 1.0, 1.0])       →  1.0
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def perplexity(probabilities: list) -> float:
    """
    Calculate perplexity of a language model over a sequence.

    Args:
        probabilities: list of per-token probabilities assigned by the LM
    Returns:
        float perplexity score, rounded to 5 decimal places
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'perplexity([0.5,0.5,0.5,0.5])', expected_output: '2.0',     is_hidden: false, description: 'Uniform 0.5' },
      { id: 2, function_call: 'perplexity([1.0,1.0,1.0])',     expected_output: '1.0',     is_hidden: false, description: 'Perfect model' },
      { id: 3, function_call: 'perplexity([0.1,0.2,0.5])',     expected_output: '5.84804', is_hidden: true,  description: 'Mixed probs' },
      { id: 4, function_call: 'perplexity([0.9,0.8,0.95])',    expected_output: '1.13956', is_hidden: true,  description: 'High prob tokens' },
    ],
  },

  // ── 13 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 13,
    title: 'TF-IDF Score',
    slug: 'tf-idf-score',
    difficulty: 'Medium',
    topic: 'NLP',
    tags: ['NLP', 'Information Retrieval', 'RAG'],
    companies: ['Google', 'Elastic', 'Amazon'],
    hints: [
      'TF = count(term in doc) / len(doc)',
      'IDF = log(total_docs / docs_containing_term)',
      'TF-IDF = TF × IDF',
      'Use math.log() for natural log.',
    ],
    description: `## TF-IDF Score

**Term Frequency–Inverse Document Frequency** — the classic information retrieval formula still used in BM25 and hybrid search.

### Formula
\`TF(t, d)   = count(t in d) / len(d)\`
\`IDF(t, D)  = log(|D| / df(t))\`
\`TF-IDF     = TF × IDF\`

Where df(t) = number of documents containing term t.

### Example
\`\`\`
term = "python"
doc  = ["python", "is", "great"]
corpus = [["python","is","great"], ["java","is","fast"]]
→  TF = 1/3, IDF = log(2/1) = 0.69315
→  TF-IDF = 0.23105
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def tfidf(term: str, doc_tokens: list, corpus: list) -> float:
    """
    Compute TF-IDF score for a term in a document.

    Args:
        term:       the query term
        doc_tokens: tokenized document (list of strings)
        corpus:     list of tokenized documents
    Returns:
        float TF-IDF score, rounded to 5 decimal places
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'tfidf("python",["python","is","great"],[["python","is","great"],["java","is","fast"]])', expected_output: '0.23105', is_hidden: false, description: 'Basic TF-IDF' },
      { id: 2, function_call: 'tfidf("is",["python","is","great"],[["python","is","great"],["java","is","fast"]])',     expected_output: '0.0',     is_hidden: false, description: 'Appears in all docs IDF=0' },
      { id: 3, function_call: 'tfidf("cat",["cat","cat","dog"],[["cat","cat","dog"],["bird","fish"],["cat","fish"]])',  expected_output: '0.27031', is_hidden: true,  description: 'TF=2/3, IDF=log(3/2)' },
    ],
  },

  // ── 14 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 14,
    title: 'Levenshtein Distance',
    slug: 'levenshtein-distance',
    difficulty: 'Medium',
    topic: 'NLP',
    tags: ['NLP', 'Dynamic Programming', 'Edit Distance'],
    companies: ['Google', 'Amazon', 'Microsoft'],
    hints: [
      'Use dynamic programming with a 2D table.',
      'dp[i][j] = edit distance between s1[:i] and s2[:j]',
      'Three operations: insert, delete, substitute (each costs 1).',
    ],
    description: `## Levenshtein (Edit) Distance

The minimum number of **single-character edits** (insert, delete, substitute) to transform one string into another. Foundation of spell-checkers and fuzzy matching.

### Example
\`\`\`
levenshtein("kitten", "sitting")  →  3
# kitten → sitten (sub k→s)
# sitten → sittin (sub e→i)
# sittin → sitting (insert g)
\`\`\``,
    starter_code: `def levenshtein(s1: str, s2: str) -> int:
    """
    Compute minimum edit distance between two strings.

    Args:
        s1, s2: input strings
    Returns:
        int: minimum number of edits (insert/delete/substitute)
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'levenshtein("kitten","sitting")', expected_output: '3',  is_hidden: false, description: 'Classic example' },
      { id: 2, function_call: 'levenshtein("","abc")',           expected_output: '3',  is_hidden: false, description: 'Empty string' },
      { id: 3, function_call: 'levenshtein("abc","abc")',        expected_output: '0',  is_hidden: false, description: 'Identical' },
      { id: 4, function_call: 'levenshtein("abc","xyz")',        expected_output: '3',  is_hidden: true,  description: 'Full substitution' },
      { id: 5, function_call: 'levenshtein("saturday","sunday")',expected_output: '3',  is_hidden: true,  description: 'Realistic' },
    ],
  },

  // ── 15 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 15,
    title: 'Gradient Descent Step',
    slug: 'gradient-descent-step',
    difficulty: 'Medium',
    topic: 'Math',
    tags: ['Math', 'Optimization', 'Training'],
    companies: ['Google', 'Meta', 'OpenAI'],
    hints: [
      'θ_new = θ_old - lr × gradient',
      'Apply element-wise to each parameter.',
      'Round to 5 decimal places.',
    ],
    description: `## Gradient Descent Step

The atomic operation of neural network training. Update parameters by moving in the **negative gradient direction**.

### Formula
\`θ_new[i] = θ_old[i] - lr × gradient[i]\`

### Example
\`\`\`
gradient_step([1.0, 2.0], [0.1, 0.2], lr=0.1)
→  [0.99, 1.98]
\`\`\`

### Variants
- SGD: gradient from one sample
- Mini-batch: gradient averaged over a batch
- Adam: adaptive learning rate per parameter

Round to **5 decimal places**.`,
    starter_code: `def gradient_step(params: list, gradients: list, lr: float) -> list:
    """
    Perform one gradient descent update step.

    Args:
        params:    current parameter values
        gradients: gradient of loss w.r.t. each parameter
        lr:        learning rate
    Returns:
        updated parameter values
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'gradient_step([1.0,2.0],[0.1,0.2],0.1)',  expected_output: '[0.99, 1.98]',  is_hidden: false, description: 'Basic step' },
      { id: 2, function_call: 'gradient_step([0.0],[1.0],0.01)',          expected_output: '[-0.01]',       is_hidden: false, description: 'Single param' },
      { id: 3, function_call: 'gradient_step([5.0,3.0],[-0.5,0.5],0.1)', expected_output: '[5.05, 2.95]',  is_hidden: true,  description: 'Negative gradient' },
    ],
  },

  // ── 16 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 16,
    title: 'Positional Encoding',
    slug: 'positional-encoding',
    difficulty: 'Medium',
    topic: 'Transformers',
    tags: ['Transformers', 'Attention', 'Encoding'],
    companies: ['Google', 'OpenAI', 'Meta'],
    hints: [
      'PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))',
      'PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))',
      'Even indices use sin, odd indices use cos.',
      'Use math.sin, math.cos, math.pow.',
    ],
    description: `## Positional Encoding

Transformers have no built-in notion of order — **positional encodings** inject position information into token embeddings.

### Formula (Vaswani et al. 2017)
\`PE(pos, 2i)   = sin(pos / 10000^(2i/d))\`
\`PE(pos, 2i+1) = cos(pos / 10000^(2i/d))\`

### Example
\`\`\`
positional_encoding(pos=0, d_model=4)
→  [0.0, 1.0, 0.0, 1.0]
# i=0: sin(0)=0, cos(0)=1
# i=1: sin(0)=0, cos(0)=1
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def positional_encoding(pos: int, d_model: int) -> list:
    """
    Compute the positional encoding vector for position pos.

    Args:
        pos:     token position (0-indexed)
        d_model: embedding dimension (must be even)
    Returns:
        list of d_model floats
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'positional_encoding(0, 4)', expected_output: '[0.0, 1.0, 0.0, 1.0]',                    is_hidden: false, description: 'Position 0' },
      { id: 2, function_call: 'positional_encoding(1, 4)', expected_output: '[0.84147, 0.5403, 0.01, 0.99995]',         is_hidden: false, description: 'Position 1' },
      { id: 3, function_call: 'positional_encoding(0, 2)', expected_output: '[0.0, 1.0]',                               is_hidden: true,  description: 'd_model=2' },
    ],
  },

  // ── 17 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 17,
    title: 'Batch Normalization',
    slug: 'batch-normalization',
    difficulty: 'Medium',
    topic: 'Deep Learning',
    tags: ['Deep Learning', 'Normalization', 'Training'],
    companies: ['Google', 'Nvidia', 'Meta'],
    hints: [
      'Same formula as Layer Norm but treats the input as a batch.',
      'mean = sum(x) / N',
      'variance = sum((xi - mean)^2) / N  (population variance)',
      'Use epsilon=1e-8.',
    ],
    description: `## Batch Normalization

Normalizes activations **across the batch dimension**, dramatically improving training stability and speed.

### Formula
\`BN(x) = (x - μ_B) / √(σ²_B + ε)\`

Where μ_B and σ²_B are the batch mean and variance.

### Example
\`\`\`
batch_norm([1.0, 2.0, 3.0, 4.0])
→  [-1.34164, -0.44721, 0.44721, 1.34164]
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def batch_norm(values: list, epsilon: float = 1e-8) -> list:
    """
    Apply batch normalization to a 1D list of values.

    Args:
        values:  list of floats (one batch)
        epsilon: small value for numerical stability
    Returns:
        normalized values with mean≈0 and std≈1
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'batch_norm([1.0,2.0,3.0,4.0])',  expected_output: '[-1.34164, -0.44721, 0.44721, 1.34164]', is_hidden: false, description: 'Basic 4-element' },
      { id: 2, function_call: 'batch_norm([5.0,5.0,5.0])',      expected_output: '[0.0, 0.0, 0.0]',                         is_hidden: false, description: 'Constant batch' },
      { id: 3, function_call: 'batch_norm([2.0,4.0])',           expected_output: '[-1.0, 1.0]',                             is_hidden: true,  description: 'Two elements' },
    ],
  },

  // ── 18 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 18,
    title: 'KNN Classifier',
    slug: 'knn-classifier',
    difficulty: 'Medium',
    topic: 'Classical ML',
    tags: ['Classical ML', 'KNN', 'Classification'],
    companies: ['Google', 'Amazon', 'Microsoft'],
    hints: [
      'Compute Euclidean distance from query to each training point.',
      'Sort by distance, take the k nearest.',
      'Return the most common label among k neighbors (majority vote).',
    ],
    description: `## K-Nearest Neighbors Classifier

Classify a point by majority vote among its **K nearest training examples** — the simplest non-parametric classifier.

### Algorithm
1. Compute Euclidean distance from query to all training points
2. Select the K nearest neighbors
3. Return the label with the most votes

### Example
\`\`\`
train = [[0,0],[1,0],[0,1],[1,1]]
labels = [0, 0, 1, 1]
knn(train, labels, query=[0.4,0.4], k=3)  →  0
\`\`\``,
    starter_code: `def knn(train_points: list, train_labels: list, query: list, k: int) -> int:
    """
    K-Nearest Neighbors classifier.

    Args:
        train_points: list of [x, y] coordinate pairs
        train_labels: label for each training point
        query:        point to classify [x, y]
        k:            number of neighbors to consider
    Returns:
        predicted label (int)
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'knn([[0,0],[1,0],[0,1],[1,1]],[0,0,1,1],[0.4,0.4],3)', expected_output: '0', is_hidden: false, description: 'Nearest to class 0' },
      { id: 2, function_call: 'knn([[0,0],[1,0],[0,1],[1,1]],[0,0,1,1],[0.6,0.6],3)', expected_output: '1', is_hidden: false, description: 'Nearest to class 1' },
      { id: 3, function_call: 'knn([[0,0],[2,0]],[0,1],[0.4,0],1)',                   expected_output: '0', is_hidden: true,  description: 'k=1 nearest' },
    ],
  },

  // ── 19 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 19,
    title: 'Scaled Dot-Product Attention',
    slug: 'scaled-dot-product-attention',
    difficulty: 'Hard',
    topic: 'Transformers',
    tags: ['Transformers', 'Attention', 'Architecture'],
    companies: ['OpenAI', 'Google', 'Meta', 'Anthropic'],
    hints: [
      'Attention(Q,K,V) = softmax(Q @ K.T / sqrt(d_k)) @ V',
      'Implement matrix multiplication manually (lists of lists).',
      'Apply softmax row-wise to the attention scores.',
      'd_k = number of columns in Q (and K).',
    ],
    description: `## Scaled Dot-Product Attention

The core operation of every Transformer. Computes **weighted sum of values** based on query-key similarity.

### Formula
\`Attention(Q, K, V) = softmax(Q × Kᵀ / √d_k) × V\`

### Steps
1. Compute attention scores: Q × Kᵀ
2. Scale by √d_k (prevents vanishing softmax gradients)
3. Apply softmax row-wise → attention weights
4. Multiply by V → weighted context

### Example (2×2 matrices)
\`\`\`
Q = K = [[1,0],[0,1]]
V = [[1,2],[3,4]]
d_k = 2
→ Output ≈ [[1.66082, 2.66082], [2.33918, 3.33918]]
\`\`\`

Round to **5 decimal places**.`,
    starter_code: `def attention(Q: list, K: list, V: list) -> list:
    """
    Scaled dot-product attention.

    Args:
        Q: Query matrix  (n × d_k) — list of lists
        K: Key matrix    (m × d_k) — list of lists
        V: Value matrix  (m × d_v) — list of lists
    Returns:
        Output matrix (n × d_v)
    """
    import math

    # Your code here
    # Hint: implement matrix multiply, softmax, then weighted sum
    pass`,
    test_cases: [
      { id: 1, function_call: 'attention([[1,0],[0,1]],[[1,0],[0,1]],[[1,2],[3,4]])', expected_output: '[[1.66082, 2.66082], [2.33918, 3.33918]]', is_hidden: false, description: '2×2 identity Q,K' },
      { id: 2, function_call: 'attention([[1,0]],[[1,0],[0,1]],[[10,20],[30,40]])',   expected_output: '[[16.60882, 26.60882]]',                    is_hidden: false, description: 'Single query' },
      { id: 3, function_call: 'attention([[0,0]],[[1,0],[0,1]],[[5,6],[7,8]])',       expected_output: '[[6.0, 7.0]]',                              is_hidden: true,  description: 'Zero query → uniform attention' },
    ],
  },

  // ── 20 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 20,
    title: 'Numerically Stable Softmax',
    slug: 'numerically-stable-softmax',
    difficulty: 'Hard',
    topic: 'Math',
    tags: ['Math', 'Numerical Stability', 'LLM', 'Production'],
    companies: ['OpenAI', 'Google', 'Nvidia'],
    hints: [
      'The log-sum-exp trick: subtract max(x) before exp to prevent overflow.',
      'softmax(x) == softmax(x - max(x)) (shift invariance).',
      'This prevents exp(800) = overflow and exp(-800) = underflow.',
    ],
    description: `## Numerically Stable Softmax

In production LLMs, logit values can be very large. Naively computing exp(800) causes **float overflow** (inf). The **log-sum-exp trick** fixes this.

### The Problem
\`exp(1000)\` → overflow (inf)

### The Fix: Subtract max before exp
\`stable_softmax(x) = softmax(x - max(x))\`

This is mathematically identical (shift invariance) but numerically safe.

### Example
\`\`\`
stable_softmax([1000, 1001, 1002])  should NOT overflow
→ [0.09003, 0.24473, 0.66524]
\`\`\`

### Also implement: log-softmax (used in cross-entropy loss)
\`log_softmax(x) = x - max(x) - log(Σ exp(x - max(x)))\`

Round to **5 decimal places**.`,
    starter_code: `def stable_softmax(logits: list) -> list:
    """
    Numerically stable softmax using the log-sum-exp trick.
    Must handle very large values without overflow.
    """
    # Your code here
    pass

def log_softmax(logits: list) -> list:
    """
    Compute log(softmax(x)) stably.
    Used directly in cross-entropy loss for numerical stability.
    """
    # Your code here
    pass`,
    test_cases: [
      { id: 1, function_call: 'stable_softmax([1000,1001,1002])', expected_output: '[0.09003, 0.24473, 0.66524]', is_hidden: false, description: 'Large values no overflow' },
      { id: 2, function_call: 'stable_softmax([1.0,2.0,3.0])',    expected_output: '[0.09003, 0.24473, 0.66524]', is_hidden: false, description: 'Same as regular softmax' },
      { id: 3, function_call: 'stable_softmax([-1000,-999,-998])',  expected_output: '[0.09003, 0.24473, 0.66524]', is_hidden: true,  description: 'Very negative no underflow' },
      { id: 4, function_call: 'log_softmax([1.0,2.0,3.0])',        expected_output: '[-2.40761, -1.40761, -0.40761]', is_hidden: true, description: 'Log softmax' },
    ],
  },

  // ── 21 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 21, title: 'F1 Score', slug: 'f1-score', difficulty: 'Easy', topic: 'Math',
    tags: ['Math','Evaluation','Classification'], companies: ['Google','Meta'],
    hints: ['F1 = 2 * precision * recall / (precision + recall)', 'precision = TP/(TP+FP), recall = TP/(TP+FN)'],
    description: `## F1 Score\n\nThe harmonic mean of precision and recall. The standard metric when class imbalance matters.\n\n### Formula\n\`F1 = 2 × (precision × recall) / (precision + recall)\`\n\n### Example\n\`\`\`\nf1_score(tp=8, fp=2, fn=1) → 0.88889\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def f1_score(tp: int, fp: int, fn: int) -> float:\n    """\n    Compute F1 score from confusion matrix values.\n    tp: True Positives, fp: False Positives, fn: False Negatives\n    Returns: F1 score in [0, 1]\n    """\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'f1_score(8, 2, 1)', expected_output: '0.88889', is_hidden: false, description: 'Standard case' },
      { id: 2, function_call: 'f1_score(10, 0, 0)', expected_output: '1.0', is_hidden: false, description: 'Perfect score' },
      { id: 3, function_call: 'f1_score(0, 5, 5)', expected_output: '0.0', is_hidden: true, description: 'Zero F1' },
      { id: 4, function_call: 'f1_score(5, 5, 5)', expected_output: '0.5', is_hidden: true, description: 'Equal errors' },
    ],
  },

  // ── 22 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 22, title: 'Mean Squared Error', slug: 'mean-squared-error', difficulty: 'Easy', topic: 'Math',
    tags: ['Math','Loss Functions','Regression'], companies: ['Google','Amazon'],
    hints: ['MSE = mean((y_true[i] - y_pred[i])^2)', 'Use a list comprehension or sum()'],
    description: `## Mean Squared Error\n\nThe standard regression loss. Penalizes large errors more than MAE.\n\n### Formula\n\`MSE = (1/n) × Σ (y_true[i] - y_pred[i])²\`\n\n### Example\n\`\`\`\nmse([1,2,3], [1,2,4]) → 0.33333\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def mse(y_true: list, y_pred: list) -> float:\n    """Mean Squared Error between true and predicted values."""\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'mse([1,2,3],[1,2,4])', expected_output: '0.33333', is_hidden: false, description: 'One wrong prediction' },
      { id: 2, function_call: 'mse([1,2,3],[1,2,3])', expected_output: '0.0', is_hidden: false, description: 'Perfect predictions' },
      { id: 3, function_call: 'mse([0,0,0],[1,1,1])', expected_output: '1.0', is_hidden: true, description: 'All off by 1' },
      { id: 4, function_call: 'mse([3,2,1],[1,2,3])', expected_output: '2.66667', is_hidden: true, description: 'Reversed predictions' },
    ],
  },

  // ── 23 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 23, title: 'L2 Normalization', slug: 'l2-normalization', difficulty: 'Easy', topic: 'Vector DB',
    tags: ['Vector DB','Embeddings','Math'], companies: ['Pinecone','OpenAI'],
    hints: ['Divide each element by the L2 norm: sqrt(sum of squares)', 'After normalization, the vector has magnitude 1'],
    description: `## L2 Normalization\n\nNormalize a vector to unit length. Essential before cosine similarity — ensures dot product equals cosine similarity.\n\n### Formula\n\`x_norm[i] = x[i] / ||x||\`  where  \`||x|| = sqrt(Σ x[i]²)\`\n\n### Example\n\`\`\`\nl2_normalize([3, 4]) → [0.6, 0.8]  # magnitude = 5 → 3/5, 4/5\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def l2_normalize(vector: list) -> list:\n    """Normalize vector to unit length (L2 norm = 1.0)."""\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'l2_normalize([3,4])', expected_output: '[0.6, 0.8]', is_hidden: false, description: '3-4-5 right triangle' },
      { id: 2, function_call: 'l2_normalize([1,0,0])', expected_output: '[1.0, 0.0, 0.0]', is_hidden: false, description: 'Already unit vector' },
      { id: 3, function_call: 'l2_normalize([1,1,1])', expected_output: '[0.57735, 0.57735, 0.57735]', is_hidden: true, description: 'Equal components' },
      { id: 4, function_call: 'l2_normalize([0,3,4])', expected_output: '[0.0, 0.6, 0.8]', is_hidden: true, description: 'Zero component' },
    ],
  },

  // ── 24 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 24, title: 'KL Divergence', slug: 'kl-divergence', difficulty: 'Medium', topic: 'Math',
    tags: ['Math','Probability','LLM'], companies: ['OpenAI','Anthropic','Google'],
    hints: ['KL(P||Q) = sum(P[i] * log(P[i] / Q[i]))', 'Skip terms where P[i] == 0', 'Use math.log (natural log)'],
    description: `## KL Divergence\n\nMeasures how distribution P differs from Q. Used in RLHF (KL penalty), VAEs, and information theory.\n\n### Formula\n\`KL(P || Q) = Σ P[i] × log(P[i] / Q[i])\`\n\n### Key properties\n- KL(P || Q) ≠ KL(Q || P) — not symmetric\n- KL = 0 when P = Q\n- Always ≥ 0 (Gibbs inequality)\n\n### Example\n\`\`\`\nkl_divergence([0.5,0.5],[0.4,0.6]) → 0.02041\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def kl_divergence(p: list, q: list) -> float:\n    """\n    KL divergence from distribution P to Q.\n    p, q: probability distributions (sum to 1.0)\n    Returns: float ≥ 0\n    """\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'kl_divergence([0.5,0.5],[0.4,0.6])', expected_output: '0.02041', is_hidden: false, description: 'Close distributions' },
      { id: 2, function_call: 'kl_divergence([0.5,0.5],[0.5,0.5])', expected_output: '0.0', is_hidden: false, description: 'Identical distributions' },
      { id: 3, function_call: 'kl_divergence([0.9,0.1],[0.5,0.5])', expected_output: '0.36798', is_hidden: true, description: 'Divergent distributions' },
      { id: 4, function_call: 'kl_divergence([0.0,1.0],[0.5,0.5])', expected_output: '0.69315', is_hidden: true, description: 'One zero probability' },
    ],
  },

  // ── 25 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 25, title: 'Recall@K', slug: 'recall-at-k', difficulty: 'Easy', topic: 'RAG',
    tags: ['RAG','Evaluation','Retrieval'], companies: ['Pinecone','Cohere','Anthropic'],
    hints: ['Recall@K = |relevant ∩ retrieved[:K]| / |relevant|', 'Divide by total number of relevant docs (not K)'],
    description: `## Recall@K\n\nCompanion to Precision@K. Measures what fraction of ALL relevant documents appear in the top-K results.\n\n### Formula\n\`Recall@K = |relevant ∩ retrieved[:K]| / |relevant|\`\n\n### Example\n\`\`\`\nrelevant  = [1, 2, 3]\nretrieved = [1, 4, 2, 5, 6]\nK = 3 → top-3 = [1, 4, 2]\n→ 2 relevant in top-3 out of 3 total → 2/3 = 0.66667\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def recall_at_k(relevant: list, retrieved: list, k: int) -> float:\n    """\n    Compute Recall@K.\n    relevant:  list of relevant doc IDs\n    retrieved: retrieved doc IDs in rank order\n    k:         cutoff rank\n    """\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'recall_at_k([1,2,3],[1,4,2,5,6],3)', expected_output: '0.66667', is_hidden: false, description: '2/3 found in top-3' },
      { id: 2, function_call: 'recall_at_k([1,2],[1,2,3,4,5],2)', expected_output: '1.0', is_hidden: false, description: 'All found in top-2' },
      { id: 3, function_call: 'recall_at_k([1,2,3],[4,5,6],3)', expected_output: '0.0', is_hidden: true, description: 'Nothing relevant retrieved' },
      { id: 4, function_call: 'recall_at_k([1,2,3,4],[1,2,5,6],4)', expected_output: '0.5', is_hidden: true, description: 'Half retrieved' },
    ],
  },

  // ── 26 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 26, title: 'Moving Average', slug: 'moving-average', difficulty: 'Easy', topic: 'MLOps',
    tags: ['MLOps','Statistics','Monitoring'], companies: ['Google','Amazon','Microsoft'],
    hints: ['For each window of size k, compute the mean', 'Result length = len(values) - k + 1'],
    description: `## Moving Average\n\nUsed in ML to smooth training curves, monitor model metrics, and detect drift in production.\n\n### Formula\n\`MA[i] = mean(values[i : i+k])\`\n\n### Example\n\`\`\`\nmoving_average([1,2,3,4,5], k=3) → [2.0, 3.0, 4.0]\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def moving_average(values: list, k: int) -> list:\n    """Compute simple moving average with window size k."""\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'moving_average([1,2,3,4,5],3)', expected_output: '[2.0, 3.0, 4.0]', is_hidden: false, description: 'Basic window=3' },
      { id: 2, function_call: 'moving_average([1,1,1,1],2)', expected_output: '[1.0, 1.0, 1.0]', is_hidden: false, description: 'Constant sequence' },
      { id: 3, function_call: 'moving_average([10,20,30,40,50],2)', expected_output: '[15.0, 25.0, 35.0, 45.0]', is_hidden: true, description: 'Window=2' },
      { id: 4, function_call: 'moving_average([5],1)', expected_output: '[5.0]', is_hidden: true, description: 'Single element' },
    ],
  },

  // ── 27 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 27, title: 'Nucleus (Top-p) Sampling', slug: 'nucleus-sampling', difficulty: 'Medium', topic: 'LLM',
    tags: ['LLM','Sampling','Decoding'], companies: ['OpenAI','Anthropic','Mistral'],
    hints: ['Sort probabilities descending', 'Find smallest set of tokens whose cumulative prob >= p', 'Return the indices of that set'],
    description: `## Nucleus (Top-p) Sampling\n\nUsed by GPT-4, Claude, and all modern LLMs. Selects the smallest set of tokens whose cumulative probability exceeds threshold p.\n\n### Algorithm\n1. Sort tokens by probability (descending)\n2. Accumulate until sum ≥ p\n3. Return the selected token indices\n\n### Why better than top-k\nAdapts vocabulary size based on confidence — uses fewer tokens when model is confident, more when uncertain.\n\n### Example\n\`\`\`\nnucleus_indices([0.5, 0.3, 0.15, 0.05], p=0.8)\n# cumsum: 0.5, 0.8 → stop after 2 tokens\n→ [0, 1]  (indices sorted by probability)\n\`\`\``,
    starter_code: `def nucleus_indices(probs: list, p: float) -> list:\n    """\n    Return indices of tokens in the nucleus (top-p) set.\n    probs: probability distribution (sums to 1.0)\n    p:     cumulative probability threshold (0 < p <= 1.0)\n    Returns: sorted list of indices (by original position)\n    """\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'nucleus_indices([0.5,0.3,0.15,0.05],0.8)', expected_output: '[0, 1]', is_hidden: false, description: 'p=0.8 selects top 2' },
      { id: 2, function_call: 'nucleus_indices([0.5,0.3,0.15,0.05],1.0)', expected_output: '[0, 1, 2, 3]', is_hidden: false, description: 'p=1.0 selects all' },
      { id: 3, function_call: 'nucleus_indices([0.25,0.25,0.25,0.25],0.5)', expected_output: '[0, 1]', is_hidden: true, description: 'Uniform distribution' },
      { id: 4, function_call: 'nucleus_indices([0.9,0.05,0.03,0.02],0.9)', expected_output: '[0]', is_hidden: true, description: 'One dominant token' },
    ],
  },

  // ── 28 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 28, title: 'Transformer Feed-Forward Layer', slug: 'transformer-ffn', difficulty: 'Medium', topic: 'Transformers',
    tags: ['Transformers','Architecture','Deep Learning'], companies: ['OpenAI','Google','Meta'],
    hints: ['FFN(x) = W2 * GELU(W1 * x + b1) + b2', 'W1: d_model → d_ff, W2: d_ff → d_model', 'GELU(x) = x * 0.5 * (1 + erf(x / sqrt(2)))'],
    description: `## Transformer Feed-Forward Layer\n\nEvery transformer block has two sub-layers: attention + this FFN. The FFN expands then contracts the representation.\n\n### Architecture\n\`FFN(x) = W2 × GELU(W1 × x + b1) + b2\`\n\n- W1: d_model → d_ff (typically 4×)\n- W2: d_ff → d_model\n- GELU activation (smoother than ReLU)\n\n### Example (d_model=2, d_ff=4)\nWith random weights, verify output shape matches input shape.\n\nRound to **5 decimal places**.`,
    starter_code: `def gelu(x: float) -> float:\n    """GELU activation: x * 0.5 * (1 + erf(x / sqrt(2)))"""\n    import math\n    return x * 0.5 * (1.0 + math.erf(x / math.sqrt(2)))\n\ndef ffn_forward(x: list, W1: list, b1: list, W2: list, b2: list) -> list:\n    """\n    Transformer FFN forward pass.\n    x:  input vector (d_model,)\n    W1: weight matrix (d_ff x d_model)\n    b1: bias (d_ff,)\n    W2: weight matrix (d_model x d_ff)\n    b2: bias (d_model,)\n    Returns: output vector (d_model,)\n    """\n    # Step 1: h = GELU(W1 @ x + b1)\n    # Step 2: out = W2 @ h + b2\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'gelu(0.0)', expected_output: '0.0', is_hidden: false, description: 'GELU at 0' },
      { id: 2, function_call: 'gelu(1.0)', expected_output: '0.84134', is_hidden: false, description: 'GELU at 1' },
      { id: 3, function_call: 'ffn_forward([1.0,0.0],[[1.0,0.0],[0.0,1.0]],[0.0,0.0],[[1.0,0.0],[0.0,1.0]],[0.0,0.0])', expected_output: '[0.84134, 0.0]', is_hidden: true, description: 'Identity weights' },
    ],
  },

  // ── 29 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 29, title: 'Exponential Moving Average', slug: 'exponential-moving-average', difficulty: 'Easy', topic: 'MLOps',
    tags: ['MLOps','Optimization','Training'], companies: ['Google','Meta','Nvidia'],
    hints: ['EMA[0] = values[0]', 'EMA[i] = alpha * values[i] + (1-alpha) * EMA[i-1]', 'Higher alpha = more weight on recent values'],
    description: `## Exponential Moving Average (EMA)\n\nUsed everywhere in ML: Adam optimizer (EMA of gradients), batch norm (EMA of statistics), model EMA for stable training.\n\n### Formula\n\`EMA[0] = values[0]\`\n\`EMA[i] = α × values[i] + (1-α) × EMA[i-1]\`\n\n### Example\n\`\`\`\nema([1.0, 2.0, 3.0, 4.0], alpha=0.5)\n→ [1.0, 1.5, 2.25, 3.125]\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def ema(values: list, alpha: float) -> list:\n    """\n    Compute exponential moving average.\n    alpha: smoothing factor in (0, 1]. Higher = more responsive.\n    """\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'ema([1.0,2.0,3.0,4.0],0.5)', expected_output: '[1.0, 1.5, 2.25, 3.125]', is_hidden: false, description: 'alpha=0.5' },
      { id: 2, function_call: 'ema([5.0,5.0,5.0],0.3)', expected_output: '[5.0, 5.0, 5.0]', is_hidden: false, description: 'Constant series' },
      { id: 3, function_call: 'ema([0.0,10.0],0.9)', expected_output: '[0.0, 9.0]', is_hidden: true, description: 'High alpha fast response' },
      { id: 4, function_call: 'ema([1.0],0.5)', expected_output: '[1.0]', is_hidden: true, description: 'Single value' },
    ],
  },

  // ── 30 ───────────────────────────────────────────────────────────────────────
  {
    order_index: 30, title: 'NDCG (Normalized DCG)', slug: 'ndcg', difficulty: 'Hard', topic: 'RAG',
    tags: ['RAG','Evaluation','Information Retrieval'], companies: ['Google','Meta','Elastic'],
    hints: ['DCG = sum(rel[i] / log2(i+2)) for i in range(k)', 'NDCG = DCG / IDCG where IDCG is DCG of perfect ranking', 'log2(pos+1) where pos is 1-indexed'],
    description: `## NDCG — Normalized Discounted Cumulative Gain\n\nThe gold-standard retrieval metric used by search engines and RAG evaluations. Rewards highly relevant results appearing at the top.\n\n### Formula\n\`DCG@K = Σ rel[i] / log₂(i+2)\` (i is 0-indexed)\n\`NDCG@K = DCG@K / IDCG@K\`\n\nWhere IDCG is the DCG of the ideal (perfectly sorted) ranking.\n\n### Example\n\`\`\`\n# relevance scores: [3, 2, 3, 0, 1, 2]\nndcg([3,2,3,0,1,2], k=4)\n# DCG = 3/log2(2) + 2/log2(3) + 3/log2(4) + 0/log2(5)\n# IDCG = ideal DCG for sorted [3,3,2,2,1,0]\n→ 0.78514\n\`\`\`\n\nRound to **5 decimal places**.`,
    starter_code: `def ndcg(relevances: list, k: int) -> float:\n    """\n    Compute NDCG@K.\n    relevances: list of relevance scores for retrieved docs (in rank order)\n    k:          cutoff rank\n    Returns: float in [0, 1]\n    """\n    import math\n    # Your code here\n    pass`,
    test_cases: [
      { id: 1, function_call: 'ndcg([3,2,3,0,1,2],4)', expected_output: '0.78514', is_hidden: false, description: 'Standard NDCG' },
      { id: 2, function_call: 'ndcg([3,3,2,2],4)', expected_output: '1.0', is_hidden: false, description: 'Perfect ranking' },
      { id: 3, function_call: 'ndcg([0,0,3,3],4)', expected_output: '0.55691', is_hidden: true, description: 'Relevant at bottom' },
      { id: 4, function_call: 'ndcg([1,0,0,0],1)', expected_output: '1.0', is_hidden: true, description: 'K=1 perfect' },
    ],
  },
]
