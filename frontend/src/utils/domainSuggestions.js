export const getDomainSuggestions = (languages) => {
    const domainMap = {
      JavaScript: ['Web Development', 'Full Stack Development', 'Frontend Development', 'Node.js Development'],
      TypeScript: ['Web Development', 'Enterprise Applications', 'Full Stack Development', 'Angular Development'],
      Python: ['Data Science', 'Machine Learning', 'Backend Development', 'AI Development', 'DevOps', 'Automation'],
      Java: ['Enterprise Development', 'Android Development', 'Backend Development', 'Spring Development'],
      Kotlin: ['Android Development', 'Mobile Development', 'Cross-platform Development'],
      Swift: ['iOS Development', 'Mobile Development', 'Apple Ecosystem Development'],
      PHP: ['Web Development', 'Backend Development', 'WordPress Development', 'CMS Development'],
      'C#': ['Game Development', '.NET Development', 'Enterprise Applications', 'Unity Development', 'Windows Development'],
      'C++': ['Game Development', 'Systems Programming', 'Performance-Critical Applications', 'Embedded Systems'],
      Go: ['Cloud Development', 'Backend Development', 'Systems Programming', 'Microservices'],
      Rust: ['Systems Programming', 'WebAssembly Development', 'Performance-Critical Applications', 'Blockchain Development'],
      Ruby: ['Web Development', 'Backend Development', 'Ruby on Rails Development'],
      Dart: ['Mobile Development', 'Cross-platform Development', 'Flutter Development'],
      Flutter: ['Mobile Development', 'Cross-platform Development', 'UI/UX Development'],
      React: ['Frontend Development', 'Web Development', 'Mobile Development', 'React Native Development'],
      HTML: ['Web Development', 'Frontend Development', 'UI Development'],
      CSS: ['Web Development', 'Frontend Development', 'UI/UX Design', 'Web Design'],
      Shell: ['DevOps', 'System Administration', 'Automation', 'Cloud Infrastructure'],
      C: ['Systems Programming', 'Embedded Systems', 'IoT Development', 'Low-level Programming'],
      Vue: ['Frontend Development', 'Web Development', 'UI Development'],
      Angular: ['Enterprise Frontend', 'Web Development', 'Single Page Applications'],
      Scala: ['Big Data', 'Functional Programming', 'Enterprise Applications'],
      R: ['Data Science', 'Statistical Analysis', 'Data Visualization'],
      Perl: ['System Administration', 'DevOps', 'Text Processing'],
      Haskell: ['Functional Programming', 'Academic Computing', 'Formal Verification'],
      Clojure: ['Functional Programming', 'Data Processing', 'Enterprise Applications'],
      Elixir: ['Distributed Systems', 'Real-time Applications', 'Fault-tolerant Systems'],
      ObjectiveC: ['iOS Development', 'macOS Development', 'Apple Ecosystem'],
      MATLAB: ['Scientific Computing', 'Engineering', 'Academic Research'],
      Groovy: ['DevOps', 'Test Automation', 'JVM Ecosystem'],
      PowerShell: ['Windows Administration', 'DevOps', 'Automation'],
      Assembly: ['Low-level Programming', 'Embedded Systems', 'Security Research'],
      SQL: ['Database Administration', 'Data Engineering', 'Business Intelligence'],
      NoSQL: ['Database Development', 'Big Data', 'Distributed Systems'],
      GraphQL: ['API Development', 'Modern Web Development', 'Full Stack Development'],
      Solidity: ['Blockchain Development', 'Smart Contract Development', 'Web3'],
    };
  
    // Add debugging to see what's coming in
    console.log("Languages received in getDomainSuggestions:", languages);
  
    // Get the most used languages (top 3)
    const sortedLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  
    console.log("Sorted languages for domain suggestions:", sortedLanguages);
  
    const suggestions = new Set();
    sortedLanguages.forEach(([lang]) => {
      const domains = domainMap[lang] || [];
      domains.forEach(domain => suggestions.add(domain));
    });
  
    // If no suggestions were found, provide default suggestions
    if (suggestions.size === 0) {
      return ['Web Development', 'Software Engineering', 'Full Stack Development'];
    }
  
    return Array.from(suggestions).slice(0, 3);
  };
  
  export const getRoadmapLink = (domain) => {
    const roadmapLinks = {
      'Web Development': 'https://roadmap.sh/full-stack',
      'Full Stack Development': 'https://roadmap.sh/full-stack',
      'Frontend Development': 'https://roadmap.sh/frontend',
      'Backend Development': 'https://roadmap.sh/backend',
      'Data Science': 'https://roadmap.sh/ai-data-scientist',
      'Machine Learning': 'https://roadmap.sh/ai-data-scientist',
      'AI Development': 'https://roadmap.sh/ai-data-scientist',
      'Mobile Development': 'https://roadmap.sh/android',
      'Android Development': 'https://roadmap.sh/android',
      'iOS Development': 'https://roadmap.sh/ios',
      'Game Development': 'https://roadmap.sh/game-developer',
      'Cloud Development': 'https://roadmap.sh/devops',
      'Enterprise Development': 'https://roadmap.sh/software-architect',
      'Systems Programming': 'https://roadmap.sh/computer-science',
      'DevOps': 'https://roadmap.sh/devops',
      'System Administration': 'https://roadmap.sh/devops',
      'Software Engineering': 'https://roadmap.sh/software-design-architecture',
      'Embedded Systems': 'https://roadmap.sh/computer-science',
      'Node.js Development': 'https://roadmap.sh/nodejs',
      'React Development': 'https://roadmap.sh/react',
      'Angular Development': 'https://roadmap.sh/angular',
      'Vue Development': 'https://roadmap.sh/vue',
      'Spring Development': 'https://roadmap.sh/spring-boot',
      'Python Development': 'https://roadmap.sh/python',
      'Java Development': 'https://roadmap.sh/java',
      'Blockchain Development': 'https://roadmap.sh/blockchain',
      'UI/UX Design': 'https://roadmap.sh/design-system',
      'Database Administration': 'https://roadmap.sh/postgresql-dba',
      'API Development': 'https://roadmap.sh/graphql',
      'Microservices': 'https://roadmap.sh/software-architect',
      'Cross-platform Development': 'https://roadmap.sh/flutter',
      'Flutter Development': 'https://roadmap.sh/flutter',
      'React Native Development': 'https://roadmap.sh/react-native',
      'Ruby on Rails Development': 'https://roadmap.sh/ruby-on-rails',
      'WordPress Development': 'https://roadmap.sh/wordpress',
      '.NET Development': 'https://roadmap.sh/aspnet-core',
      'Unity Development': 'https://roadmap.sh/game-developer',
      'Automation': 'https://roadmap.sh/qa',
      'Test Automation': 'https://roadmap.sh/qa',
      'Data Engineering': 'https://roadmap.sh/data-engineer',
      'Business Intelligence': 'https://roadmap.sh/data-engineer',
      'Web3': 'https://roadmap.sh/blockchain',
      'Smart Contract Development': 'https://roadmap.sh/blockchain',
      'Low-level Programming': 'https://roadmap.sh/computer-science',
      'Functional Programming': 'https://roadmap.sh/computer-science',
      'Distributed Systems': 'https://roadmap.sh/system-design',
      'Cloud Infrastructure': 'https://roadmap.sh/devops',
      'IoT Development': 'https://roadmap.sh/computer-science',
      'UI Development': 'https://roadmap.sh/frontend',
      'Web Design': 'https://roadmap.sh/design-system',
    };
  
    return roadmapLinks[domain] || 'https://roadmap.sh';
  };
  
  export const getLearningResources = (domain) => {
    const resourcesMap = {
      'Web Development': [
        { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web' },
        { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/responsive-web-design/' },
        { name: 'The Odin Project', url: 'https://www.theodinproject.com/' }
      ],
      'Full Stack Development': [
        { name: 'Full Stack Open', url: 'https://fullstackopen.com/en/' },
        { name: 'The Odin Project', url: 'https://www.theodinproject.com/' },
        { name: 'App Academy Open', url: 'https://www.appacademy.io/course/app-academy-open' }
      ],
      'Frontend Development': [
        { name: 'Frontend Masters', url: 'https://frontendmasters.com/' },
        { name: 'CSS-Tricks', url: 'https://css-tricks.com/' },
        { name: 'JavaScript.info', url: 'https://javascript.info/' }
      ],
      'Backend Development': [
        { name: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/' },
        { name: 'Django Documentation', url: 'https://docs.djangoproject.com/' },
        { name: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html' }
      ],
      'Data Science': [
        { name: 'Kaggle Learn', url: 'https://www.kaggle.com/learn/overview' },
        { name: 'DataCamp', url: 'https://www.datacamp.com/' },
        { name: 'Towards Data Science', url: 'https://towardsdatascience.com/' }
      ],
      'Machine Learning': [
        { name: 'Coursera ML Course', url: 'https://www.coursera.org/learn/machine-learning' },
        { name: 'Fast.ai', url: 'https://www.fast.ai/' },
        { name: 'TensorFlow Tutorials', url: 'https://www.tensorflow.org/tutorials' }
      ],
      'AI Development': [
        { name: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/' },
        { name: 'Hugging Face', url: 'https://huggingface.co/learn' },
        { name: 'OpenAI Documentation', url: 'https://platform.openai.com/docs/introduction' }
      ],
      'Mobile Development': [
        { name: 'React Native Documentation', url: 'https://reactnative.dev/docs/getting-started' },
        { name: 'Flutter Documentation', url: 'https://flutter.dev/docs' },
        { name: 'Mobile Dev Tutorials', url: 'https://www.raywenderlich.com/' }
      ],
      'Game Development': [
        { name: 'Unity Learn', url: 'https://learn.unity.com/' },
        { name: 'Unreal Engine Documentation', url: 'https://docs.unrealengine.com/' },
        { name: 'Game Dev.net', url: 'https://www.gamedev.net/' }
      ],
      'Cloud Development': [
        { name: 'AWS Training', url: 'https://aws.amazon.com/training/' },
        { name: 'Google Cloud Training', url: 'https://cloud.google.com/training' },
        { name: 'Azure Learn', url: 'https://docs.microsoft.com/en-us/learn/azure/' }
      ],
      'DevOps': [
        { name: 'DevOps Roadmap', url: 'https://roadmap.sh/devops' },
        { name: 'Docker Documentation', url: 'https://docs.docker.com/' },
        { name: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/home/' }
      ],
      'Blockchain Development': [
        { name: 'Ethereum Documentation', url: 'https://ethereum.org/en/developers/' },
        { name: 'Solidity Documentation', url: 'https://docs.soliditylang.org/' },
        { name: 'CryptoZombies', url: 'https://cryptozombies.io/' }
      ],
      'UI/UX Design': [
        { name: 'Figma Learn', url: 'https://www.figma.com/resources/learn-design/' },
        { name: 'Nielsen Norman Group', url: 'https://www.nngroup.com/articles/' },
        { name: 'Interaction Design Foundation', url: 'https://www.interaction-design.org/' }
      ],
      'Android Development': [
        { name: 'Android Developers', url: 'https://developer.android.com/' },
        { name: 'Kotlin Documentation', url: 'https://kotlinlang.org/docs/' },
        { name: 'Android Jetpack', url: 'https://developer.android.com/jetpack' }
      ],
      'iOS Development': [
        { name: 'Swift Documentation', url: 'https://swift.org/documentation/' },
        { name: 'Apple Developer', url: 'https://developer.apple.com/documentation/' },
        { name: 'Hacking with Swift', url: 'https://www.hackingwithswift.com/' }
      ],
      'React Development': [
        { name: 'React Documentation', url: 'https://reactjs.org/docs/getting-started.html' },
        { name: 'React Patterns', url: 'https://reactpatterns.com/' },
        { name: 'Epic React', url: 'https://epicreact.dev/' }
      ],
      'Node.js Development': [
        { name: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/' },
        { name: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices' },
        { name: 'Express.js Documentation', url: 'https://expressjs.com/' }
      ],
      'Python Development': [
        { name: 'Python Documentation', url: 'https://docs.python.org/3/' },
        { name: 'Real Python', url: 'https://realpython.com/' },
        { name: 'Python Crash Course', url: 'https://nostarch.com/pythoncrashcourse2e' }
      ],
      'Java Development': [
        { name: 'Java Documentation', url: 'https://docs.oracle.com/en/java/' },
        { name: 'Baeldung', url: 'https://www.baeldung.com/' },
        { name: 'Java Code Geeks', url: 'https://www.javacodegeeks.com/' }
      ],
      'Microservices': [
        { name: 'Microservices.io', url: 'https://microservices.io/' },
        { name: 'Spring Cloud', url: 'https://spring.io/projects/spring-cloud' },
        { name: 'AWS Microservices', url: 'https://aws.amazon.com/microservices/' }
      ],
      'Software Engineering': [
        { name: 'Clean Code', url: 'https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882' },
        { name: 'Refactoring', url: 'https://refactoring.com/' },
        { name: 'Design Patterns', url: 'https://refactoring.guru/design-patterns' }
      ]
    };
  
    return resourcesMap[domain] || [];
  };