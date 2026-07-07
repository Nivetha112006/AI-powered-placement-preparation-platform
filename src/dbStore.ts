import fs from 'fs';
import path from 'path';
import { UserProfile, AptitudeQuestion, CodingProblem, RoundScore, PerformanceAnalysis } from './types';

interface DatabaseSchema {
  users: Record<string, {
    profile: UserProfile;
    scores: Record<string, RoundScore>;
    resumeParsed?: boolean;
    password?: string;
    seenCodingProblems?: string[];
    seenAptitudeQuestions?: string[];
    interviewChats: Record<string, Array<{ id: string; sender: 'interviewer' | 'candidate'; text: string; timestamp: string }>>;
    gdChats: Record<string, Array<{ id: string; sender: string; senderName: string; text: string; timestamp: string }>>;
    activeAptitudeQuestions?: AptitudeQuestion[];
    activeCodingProblems?: CodingProblem[];
    codingSubmissions: Record<string, Array<{
      problemId: string;
      language: string;
      code: string;
      status: string;
      executionTimeMs: number;
      memoryUsageKb: number;
      submittedAt: string;
    }>>;
  }>;
  aptitudeQuestions: AptitudeQuestion[];
  codingProblems: CodingProblem[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Predefined Aptitude Questions (Seed Data)
const defaultAptitudeQuestions: AptitudeQuestion[] = [
  {
    id: 'apt_1',
    topic: 'Quantitative',
    question: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
    options: ['65 seconds', '89 seconds', '100 seconds', '150 seconds'],
    correctOptionIndex: 1, // 89 seconds
    explanation: 'Speed of train = 240/24 = 10 m/s. To pass a platform 650 m long, total distance = 240 + 650 = 890 m. Time taken = 890/10 = 89 seconds.',
    difficulty: 'Easy',
  },
  {
    id: 'apt_2',
    topic: 'Logical',
    question: 'Pointing to a photograph, a man said, "I have no brother or sister but that man\'s father is my father\'s son." Whose photograph was it?',
    options: ['His own photograph', 'His son\'s photograph', 'His father\'s photograph', 'His nephew\'s photograph'],
    correctOptionIndex: 1, // His son's photograph
    explanation: 'Since the man has no brother or sister, "my father\'s son" is the man himself. So, the man\'s father is the speaker. This means the photograph is of his son.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_3',
    topic: 'Analytical',
    question: 'If log(2) = 0.3010 and log(3) = 0.4771, find the value of log(5).',
    options: ['0.6990', '0.7781', '0.1761', '0.5229'],
    correctOptionIndex: 0, // 0.6990
    explanation: 'log(5) = log(10/2) = log(10) - log(2) = 1 - 0.3010 = 0.6990.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_4',
    topic: 'Verbal',
    question: 'Choose the word that is most nearly opposite in meaning to "AFFABLE":',
    options: ['Friendly', 'Surly', 'Cheerful', 'Generous'],
    correctOptionIndex: 1, // Surly
    explanation: 'Affable means friendly, good-natured, or easy to talk to. "Surly" means bad-tempered and unfriendly, which is the exact opposite.',
    difficulty: 'Easy',
  },
  {
    id: 'apt_5',
    topic: 'Data Interpretation',
    question: 'In a company, 40% of employees are female. 60% of male employees and 40% of female employees got a promotion. What percentage of promoted employees are female?',
    options: ['25.6%', '30.8%', '40.0%', '44.4%'],
    correctOptionIndex: 1, // 30.8%
    explanation: 'Let total employees = 100. Females = 40, Males = 60. Promoted Males = 60% of 60 = 36. Promoted Females = 40% of 40 = 16. Total Promoted = 36 + 16 = 52. Percentage of female among promoted = (16 / 52) * 100 = 30.76% (approx 30.8%).',
    difficulty: 'Hard',
  },
  {
    id: 'apt_6',
    topic: 'Quantitative',
    question: 'A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. Find the sum.',
    options: ['Rs. 650', 'Rs. 690', 'Rs. 698', 'Rs. 700'],
    correctOptionIndex: 2, // Rs. 698
    explanation: 'One year simple interest = 854 - 815 = 39. Three years simple interest = 39 * 3 = 117. Principal sum = 815 - 117 = Rs. 698.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_7',
    topic: 'Quantitative',
    question: 'If 15 men can complete a work in 20 days, in how many days can 25 men complete the same work?',
    options: ['12 days', '15 days', '10 days', '18 days'],
    correctOptionIndex: 0, // 12 days
    explanation: 'Using M1 * D1 = M2 * D2: 15 * 20 = 25 * D2 => 300 = 25 * D2 => D2 = 12 days.',
    difficulty: 'Easy',
  },
  {
    id: 'apt_8',
    topic: 'Logical',
    question: 'If FRIEND is coded as HUMJTK, how is CANDLE coded in that code?',
    options: ['EDRIRL', 'DCQHQK', 'ESJFME', 'DEOKOF'],
    correctOptionIndex: 0, // EDRIRL
    explanation: 'The coding pattern is +2, +3, +4, +5, +6, +7. Applying this shift to each letter of CANDLE results in EDRIRL.',
    difficulty: 'Hard',
  },
  {
    id: 'apt_9',
    topic: 'Logical',
    question: 'In a row of boys, if A is 10th from the left and B is 9th from the right, and they interchange positions, A becomes 15th from the left. How many boys are there in the row?',
    options: ['23', '27', '28', '31'],
    correctOptionIndex: 0, // 23
    explanation: 'After interchanging, A\'s new position is 15th from the left, which is also B\'s previous position (9th from the right). Total boys = (15 + 9) - 1 = 23.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_10',
    topic: 'Analytical',
    question: 'Find the missing number in the sequence: 4, 9, 19, 39, 79, ?',
    options: ['119', '139', '159', '169'],
    correctOptionIndex: 2, // 159
    explanation: 'The pattern is (previous number * 2) + 1. Specifically: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, and 79*2+1 = 159.',
    difficulty: 'Easy',
  },
  {
    id: 'apt_11',
    topic: 'Analytical',
    question: 'If + means *, * means -, - means /, and / means +, what is the value of 8 + 4 / 6 - 3 * 2?',
    options: ['32', '34', '30', '36'],
    correctOptionIndex: 0, // 32
    explanation: 'Replacing symbols gives: 8 * 4 + 6 / 3 - 2 = 32 + 2 - 2 = 32.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_12',
    topic: 'Verbal',
    question: 'Select the word that is most synonymous with "PRISTINE":',
    options: ['Spoiled', 'Undirtied', 'Sordid', 'Antiquated'],
    correctOptionIndex: 1, // Undirtied
    explanation: 'Pristine means in its original, clean, or unspoiled condition. "Undirtied" is the closest synonym among the choices.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_13',
    topic: 'Verbal',
    question: 'Find the correctly spelt word:',
    options: ['Committe', 'Comittee', 'Committee', 'Commitee'],
    correctOptionIndex: 2, // Committee
    explanation: 'The correct spelling of the word is "Committee" (with double m, double t, and double e).',
    difficulty: 'Easy',
  },
  {
    id: 'apt_14',
    topic: 'Data Interpretation',
    question: 'A branch sold 80 books in 2024 and 110 in 2025. Branch B sold 75 in 2024 and 95 in 2025. Branch C sold 90 in 2024 and 85 in 2025. What is the ratio of total sales of Branch B for both years to Branch C for both years?',
    options: ['34:35', '17:18', '75:85', '35:36'],
    correctOptionIndex: 0, // 34:35
    explanation: 'Total Branch B sales = 75 + 95 = 170. Total Branch C sales = 90 + 85 = 175. Ratio = 170 : 175 = 34 : 35.',
    difficulty: 'Hard',
  },
  {
    id: 'apt_15',
    topic: 'Data Interpretation',
    question: 'In a household budget, Rent accounts for 30%, Food for 25%, Education for 15%, Savings for 20%, and Others for 10%. If total monthly income is Rs. 50,000, how much more is spent on Rent and Food combined than on Education and Savings combined?',
    options: ['Rs. 10,000', 'Rs. 7,500', 'Rs. 5,000', 'Rs. 12,500'],
    correctOptionIndex: 0, // Rs. 10,000
    explanation: 'Rent + Food = 55%. Education + Savings = 35%. Difference = 20% of Rs. 50,000 = Rs. 10,000.',
    difficulty: 'Medium',
  },
  {
    id: 'apt_16',
    topic: 'Quantitative',
    question: 'The average age of a class of 40 students is 15 years. When the teacher\'s age is included, the average increases by 1 year. What is the teacher\'s age?',
    options: ['40 years', '55 years', '56 years', '60 years'],
    correctOptionIndex: 2,
    explanation: 'Total age of 40 students = 40 * 15 = 600. Total age with teacher included = 41 * 16 = 656. Teacher\'s age = 656 - 600 = 56 years.',
    difficulty: 'Medium'
  },
  {
    id: 'apt_17',
    topic: 'Logical',
    question: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
    options: ['(1/3)', '1/8', '2/8', '1/16'],
    correctOptionIndex: 1,
    explanation: 'This is a simple division series where each number is one-half of the previous number. (1/4) / 2 = 1/8.',
    difficulty: 'Easy'
  },
  {
    id: 'apt_18',
    topic: 'Analytical',
    question: 'A, B, C, D and E are sitting in a row. C is sitting in the center. A and B are sitting at the extreme ends. D is sitting to the immediate left of C. Who is sitting to the immediate right of C?',
    options: ['E', 'D', 'B', 'A'],
    correctOptionIndex: 0,
    explanation: 'Since A and B are at the extreme ends and C is in the middle, the positions must be A/B _ C _ B/A. D is sitting to the immediate left of C, which means the layout must be: [A/B, D, C, E, B/A]. Therefore, E is sitting to the immediate right of C.',
    difficulty: 'Medium'
  },
  {
    id: 'apt_19',
    topic: 'Verbal',
    question: 'Identify the word with correct sentence logic: The new software was designed to ________ operations, reducing overhead costs significantly.',
    options: ['streamline', 'complicate', 'postpone', 'exasperate'],
    correctOptionIndex: 0,
    explanation: '"Streamline" means to make an organization or system more efficient and effective, which perfectly fits the objective of reducing overhead costs.',
    difficulty: 'Easy'
  },
  {
    id: 'apt_20',
    topic: 'Data Interpretation',
    question: 'A student scores 70%, 80%, and 90% in three subjects with weightages 20%, 30%, and 50% respectively. What is the weighted average score of the student?',
    options: ['80%', '82%', '83%', '85%'],
    correctOptionIndex: 2,
    explanation: 'Weighted Average = (70 * 0.2) + (80 * 0.3) + (90 * 0.5) = 14 + 24 + 45 = 83%.',
    difficulty: 'Medium'
  }
];

// Predefined Coding Problems (expanded to a pool of 8 standard MNC problems)
const defaultCodingProblems: CodingProblem[] = [
  {
    id: 'code_1',
    title: 'Two Sum Problem',
    topic: 'HashMap & Arrays',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
    ],
    sampleInput: 'nums = [2,7,11,15], target = 9',
    sampleOutput: '[0,1]',
    difficulty: 'Easy',
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Write your code here
    
}`,
      python: `def twoSum(nums: list, target: int) -> list:
    # Write your code here
    pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};`,
      java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}`
    },
    testCases: [
      { input: '[2,7,11,15]\n9', output: '[0,1]', isHidden: false },
      { input: '[3,2,4]\n6', output: '[1,2]', isHidden: false },
      { input: '[3,3]\n6', output: '[0,1]', isHidden: true }
    ]
  },
  {
    id: 'code_2',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Sliding Window & Strings',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A substring is a contiguous non-empty sequence of characters within a string.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    sampleInput: 's = "abcabcbb"',
    sampleOutput: '3 (The substring is "abc")',
    difficulty: 'Medium',
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your code here
    
}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:
    # Write your code here
    pass`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your code here
        
    }
};`,
      java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your code here
        return 0;
    }
}`
    },
    testCases: [
      { input: '"abcabcbb"', output: '3', isHidden: false },
      { input: '"bbbbb"', output: '1', isHidden: false },
      { input: '"pwwkew"', output: '3', isHidden: true }
    ]
  },
  {
    id: 'code_3',
    title: 'Climbing Stairs',
    topic: 'Dynamic Programming',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    constraints: [
      '1 <= n <= 45'
    ],
    sampleInput: 'n = 3',
    sampleOutput: '3 (1 step + 1 step + 1 step, 1 step + 2 steps, 2 steps + 1 step)',
    difficulty: 'Medium',
    starterCode: {
      javascript: `function climbStairs(n) {
    // Write your code here
    
}`,
      python: `def climbStairs(n: int) -> int:
    # Write your code here
    pass`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int climbStairs(int n) {
        // Write your code here
        return 0;
    }
}`
    },
    testCases: [
      { input: '2', output: '2', isHidden: false },
      { input: '3', output: '3', isHidden: false },
      { input: '5', output: '8', isHidden: true }
    ]
  },
  {
    id: 'code_4',
    title: 'Merge Sorted Array',
    topic: 'Two Pointers & Arrays',
    description: `You are given two integer arrays \`nums1\` and \`nums2\`, sorted in non-decreasing order, and two integers \`m\` and \`n\`, representing the number of elements in \`nums1\` and \`nums2\` respectively.

Merge \`nums1\` and \`nums2\` into a single array sorted in non-decreasing order.

The final sorted array should not be returned by the function, but instead be stored inside the array \`nums1\`. To accommodate this, \`nums1\` has a length of \`m + n\`, where the first \`m\` elements denote the elements that should be merged, and the last \`n\` elements are set to \`0\` and should be ignored.`,
    constraints: [
      'nums1.length == m + n',
      'nums2.length == n',
      '0 <= m, n <= 200',
      '-10^9 <= nums1[i], nums2[j] <= 10^9'
    ],
    sampleInput: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3',
    sampleOutput: '[1,2,2,3,5,6]',
    difficulty: 'Easy',
    starterCode: {
      javascript: `function merge(nums1, m, nums2, n) {
    // Write your code here (modify nums1 in-place)
    
}`,
      python: `def merge(nums1: list, m: int, nums2: list, n: int) -> None:
    # Write your code here (modify nums1 in-place)
    pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        // Write your code here (modify nums1 in-place)
        
    }
};`,
      java: `class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        // Write your code here (modify nums1 in-place)
        
    }
}`
    },
    testCases: [
      { input: '[1,2,3,0,0,0]\n3\n[2,5,6]\n3', output: '[1,2,2,3,5,6]', isHidden: false },
      { input: '[1]\n1\n[]\n0', output: '[1]', isHidden: false },
      { input: '[0]\n0\n[1]\n1', output: '[1]', isHidden: true }
    ]
  },
  {
    id: 'code_5',
    title: 'Valid Parentheses',
    topic: 'Stack & Strings',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\''
    ],
    sampleInput: 's = "()[]{}"',
    sampleOutput: 'true',
    difficulty: 'Easy',
    starterCode: {
      javascript: `function isValid(s) {
    // Write your code here
    
}`,
      python: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
      cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        return false;
    }
}`
    },
    testCases: [
      { input: '"()"', output: 'true', isHidden: false },
      { input: '"()[]{}"', output: 'true', isHidden: false },
      { input: '"(]"', output: 'false', isHidden: true }
    ]
  },
  {
    id: 'code_6',
    title: 'Container With Most Water',
    topic: 'Two Pointers & Arrays',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.`,
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    sampleInput: 'height = [1,8,6,2,5,4,8,3,7]',
    sampleOutput: '49',
    difficulty: 'Medium',
    starterCode: {
      javascript: `function maxArea(height) {
    // Write your code here
    
}`,
      python: `def maxArea(height: list) -> int:
    # Write your code here
    pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int maxArea(int[] height) {
        // Write your code here
        return 0;
    }
}`
    },
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', output: '49', isHidden: false },
      { input: '[1,1]', output: '1', isHidden: false },
      { input: '[4,3,2,1,4]', output: '16', isHidden: true }
    ]
  },
  {
    id: 'code_7',
    title: 'Maximum Subarray',
    topic: 'Dynamic Programming & Arrays',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.

A **subarray** is a contiguous non-empty sequence of elements within an array.`,
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    sampleInput: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
    sampleOutput: '6 (The subarray is [4,-1,2,1])',
    difficulty: 'Medium',
    starterCode: {
      javascript: `function maxSubArray(nums) {
    // Write your code here
    
}`,
      python: `def maxSubArray(nums: list) -> int:
    # Write your code here
    pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your code here
        return 0;
    }
}`
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6', isHidden: false },
      { input: '[1]', output: '1', isHidden: false },
      { input: '[5,4,-1,7,8]', output: '23', isHidden: true }
    ]
  },
  {
    id: 'code_8',
    title: 'Reverse Linked List',
    topic: 'Linked List',
    description: `Given the head of a singly linked list, reverse the list, and return *the reversed list*.

For testing purposes, the inputs and outputs are represented as standard array representations of the list values.`,
    constraints: [
      'The number of nodes in the list is in the range [0, 5000].',
      '-5000 <= Node.val <= 5000'
    ],
    sampleInput: 'head = [1,2,3,4,5]',
    sampleOutput: '[5,4,3,2,1]',
    difficulty: 'Easy',
    starterCode: {
      javascript: `function reverseList(head) {
    // Write your code here
    
}`,
      python: `def reverseList(head: list) -> list:
    # Write your code here
    pass`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> reverseList(vector<int>& head) {
        // Write your code here
        
    }
};`,
      java: `import java.util.*;

class Solution {
    public List<Integer> reverseList(List<Integer> head) {
        // Write your code here
        return head;
    }
}`
    },
    testCases: [
      { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]', output: '[2,1]', isHidden: false },
      { input: '[]', output: '[]', isHidden: true }
    ]
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: {},
      aptitudeQuestions: defaultAptitudeQuestions,
      codingProblems: defaultCodingProblems
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure default structures are seeded if missing
        if (!this.data.aptitudeQuestions || this.data.aptitudeQuestions.length === 0) {
          this.data.aptitudeQuestions = defaultAptitudeQuestions;
        }
        if (!this.data.codingProblems || this.data.codingProblems.length === 0) {
          this.data.codingProblems = defaultCodingProblems;
        } else {
          // Merge new default coding problems if their IDs don't exist
          defaultCodingProblems.forEach(p => {
            if (!this.data.codingProblems.some(existing => existing.id === p.id)) {
              this.data.codingProblems.push(p);
            }
          });
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, initializing blank schema', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database', err);
    }
  }

  userExists(email: string): boolean {
    const user = this.data.users[email.toLowerCase()];
    return !!(user && user.password);
  }

  registerUser(email: string, password?: string, name?: string, college?: string, branch?: string) {
    const userEmail = email.toLowerCase();
    
    if (this.data.users[userEmail]) {
      const existingUser = this.data.users[userEmail];
      existingUser.password = password || existingUser.password;
      if (name) existingUser.profile.name = name;
      if (college) existingUser.profile.college = college;
      if (branch) existingUser.profile.branch = branch;
      this.save();
      return existingUser;
    }

    // Create new structure
    this.data.users[userEmail] = {
      profile: {
        name: name || userEmail.split('@')[0],
        email: userEmail,
        college: college || 'V.S.B. Engineering college, Karur',
        branch: branch || 'Artificial Intelligence And Data Science',
        skills: ['Python', 'Machine Learning', 'Data Structures', 'SQL', 'JavaScript', 'HTML/CSS'],
        projects: [
          {
            title: 'AI Portfolio Website',
            description: 'A personal portfolio website showcasing my AI/ML projects and data science visualizations.',
            tech: ['React', 'CSS', 'Vite', 'Python']
          }
        ],
        education: [
          {
            degree: 'Bachelor of Technology (Artificial Intelligence And Data Science)',
            school: college || 'V.S.B. Engineering college, Karur',
            year: '2023 - 2027',
            gpa: '8.2 CGPA'
          }
        ],
        languages: ['English', 'Tamil'],
        certifications: ['Machine Learning Specialization - Coursera', 'Responsive Web Design - freeCodeCamp']
      },
      password: password || undefined,
      scores: {},
      interviewChats: {},
      gdChats: {},
      codingSubmissions: {}
    };
    
    this.save();
    return this.data.users[userEmail];
  }

  verifyPassword(email: string, password?: string): boolean {
    const user = this.data.users[email.toLowerCase()];
    if (!user) return false;
    // A password must be explicitly set and must match the input password
    if (!user.password || !password) return false;
    return user.password === password;
  }

  updatePassword(email: string, password?: string): boolean {
    const user = this.data.users[email.toLowerCase()];
    if (!user) return false;
    user.password = password;
    this.save();
    return true;
  }

  getUser(email: string) {
    const userEmail = email.toLowerCase();
    if (!this.data.users[userEmail]) {
      // Seed a default mock user structure without a password
      this.registerUser(userEmail);
    }
    return this.data.users[userEmail];
  }

  updateProfile(email: string, profile: UserProfile) {
    const user = this.getUser(email);
    user.profile = { ...user.profile, ...profile };
    this.save();
    return user.profile;
  }

  saveScore(email: string, roundId: string, score: number, feedback: string) {
    const user = this.getUser(email);
    user.scores[roundId] = {
      roundId: roundId as any,
      score,
      feedback,
      completedAt: new Date().toISOString()
    };
    this.save();
    return user.scores[roundId];
  }

  clearScore(email: string, roundId: string) {
    const user = this.getUser(email);
    if (user.scores[roundId]) {
      delete user.scores[roundId];
      this.save();
    }
  }

  getScores(email: string) {
    const user = this.getUser(email);
    return user.scores;
  }

  saveInterviewChat(email: string, sessionType: 'technical' | 'hr', chats: any[]) {
    const user = this.getUser(email);
    user.interviewChats[sessionType] = chats;
    this.save();
  }

  getInterviewChat(email: string, sessionType: 'technical' | 'hr') {
    const user = this.getUser(email);
    return user.interviewChats[sessionType] || [];
  }

  saveGDChat(email: string, gdId: string, chats: any[]) {
    const user = this.getUser(email);
    user.gdChats[gdId] = chats;
    this.save();
  }

  getGDChat(email: string, gdId: string) {
    const user = this.getUser(email);
    return user.gdChats[gdId] || [];
  }

  saveCodingSubmission(email: string, submission: any) {
    const user = this.getUser(email);
    const probId = submission.problemId;
    if (!user.codingSubmissions[probId]) {
      user.codingSubmissions[probId] = [];
    }
    user.codingSubmissions[probId].push({
      ...submission,
      submittedAt: new Date().toISOString()
    });
    this.save();
  }

  getCodingSubmissions(email: string) {
    const user = this.getUser(email);
    return user.codingSubmissions;
  }

  getAptitudeQuestions() {
    return (this.data.aptitudeQuestions && this.data.aptitudeQuestions.length > 0)
      ? this.data.aptitudeQuestions
      : defaultAptitudeQuestions;
  }

  getAptitudeQuestionsForUser(email: string) {
    const user = this.getUser(email);
    const pool = (this.data.aptitudeQuestions && this.data.aptitudeQuestions.length > 0)
      ? this.data.aptitudeQuestions
      : defaultAptitudeQuestions;
    
    const seen = user.seenAptitudeQuestions || [];
    let filteredPool = pool.filter(q => !seen.includes(q.question));
    if (filteredPool.length < 20) {
      filteredPool = pool; // fallback to complete pool if we run out
    }
    
    // Select four random questions from each of the 5 topics to get 20 questions
    const topics = ['Quantitative', 'Logical', 'Analytical', 'Verbal', 'Data Interpretation'];
    const selected: AptitudeQuestion[] = [];
    
    topics.forEach(topic => {
      const topicQuestions = filteredPool.filter(q => q.topic === topic);
      if (topicQuestions.length > 0) {
        const shuffledTopic = [...topicQuestions].sort(() => 0.5 - Math.random());
        selected.push(...shuffledTopic.slice(0, 4));
      }
    });

    // If for some reason we don't have exactly 20, fall back to simple random selection
    if (selected.length < 20) {
      const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
      user.activeAptitudeQuestions = shuffled.slice(0, 20);
    } else {
      // Shuffle the 20 selected questions
      user.activeAptitudeQuestions = selected.sort(() => 0.5 - Math.random());
    }

    this.save();
    return user.activeAptitudeQuestions;
  }

  getActiveAptitudeQuestions(email: string) {
    const user = this.getUser(email);
    if (!user.activeAptitudeQuestions || user.activeAptitudeQuestions.length < 20) {
      return this.getAptitudeQuestionsForUser(email);
    }
    return user.activeAptitudeQuestions;
  }

  getCodingProblems() {
    return this.data.codingProblems;
  }

  getCodingProblemsForUser(email: string, forceReset: boolean = false) {
    const user = this.getUser(email);
    const pool = this.data.codingProblems || defaultCodingProblems;
    
    if (forceReset || !user.activeCodingProblems || user.activeCodingProblems.length === 0) {
      // Shuffle the entire pool and select 3 distinct random coding problems
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      user.activeCodingProblems = shuffled.slice(0, 3);
      
      // Clear past submissions for these newly active problems so they start fresh
      user.activeCodingProblems.forEach(p => {
        if (user.codingSubmissions) {
          delete user.codingSubmissions[p.id];
        }
      });
      
      this.save();
    }
    return user.activeCodingProblems;
  }

  getActiveCodingProblems(email: string) {
    const user = this.getUser(email);
    if (!user.activeCodingProblems || user.activeCodingProblems.length === 0) {
      return this.getCodingProblemsForUser(email);
    }
    return user.activeCodingProblems;
  }

  getLeaderboard() {
    // Return sorted list of users based on average round scores
    return Object.keys(this.data.users).map(email => {
      const u = this.data.users[email];
      const scores = Object.values(u.scores);
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;
      return {
        name: u.profile.name,
        email: u.profile.email,
        college: u.profile.college || 'N/A',
        avgScore,
        roundsCompleted: scores.length
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }
}

export const dbStore = new Database();
