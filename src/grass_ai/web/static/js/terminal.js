class TerminalInterface {
    constructor() {
        // Set initial state
        this.isInitialized = false;
        this.history = [];
        this.historyIndex = -1;
        this.isUserScrolling = false;
        this.contractData = null; // Store contract data for conversation
        this.commands = {
            'help': () => this.showHelp(),
            'clear': () => this.clearTerminal(),
            'analyze': (address) => this.analyzeContract(address),
            'ask': (...args) => this.askGrassAI(args.join(' ')),
            'version': () => this.showVersion()
        };
        
        // Initialize API key
        this.initializeApiKey();
        
        // Initialize immediately if DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.initialize();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        }
    }

    initialize() {
        try {
            // Get terminal elements with verification
            this.terminal = document.getElementById('terminal-output');
            
            if (!this.terminal) {
                console.error('Terminal output element not found');
                return;
            }

            this.input = document.getElementById('terminal-input');
            this.prompt = document.querySelector('.terminal-prompt');

            // Clear existing content
            this.terminal.innerHTML = '';
            
            // Mark as initialized before adding welcome message
            this.isInitialized = !!(this.terminal && this.input && this.prompt);
            
            // Add welcome message
            this.appendLine('🌱 Welcome to GrassAI Terminal!', 'info');
            this.appendLine('Connected to Solana Mainnet', 'success');
            this.appendLine('Type "help" for available commands', 'system');
            this.appendLine('', 'system'); // Empty line for spacing
            
            // Initialize components
            this.initializeCommands();
            this.initializeScrolling();
            this.initializeInput();
            this.initializeHistory();

        } catch (error) {
            console.error('Terminal initialization error:', error);
        }
    }

    initializeCommands() {
        this.commands = {
            'help': () => this.showHelp(),
            'clear': () => this.clearTerminal(),
            'analyze': (address) => this.analyzeContract(address),
            'ask': (...args) => this.askGrassAI(args.join(' ')),
            'version': () => this.showVersion()
        };
    }

    initializeScrolling() {
        if (!this.terminal) return;
        
        // Remove any existing styles that might interfere
        this.terminal.style.position = 'relative';
        this.terminal.style.height = 'calc(100% - 90px)';
        this.terminal.style.overflowY = 'scroll';
        this.terminal.style.overflowX = 'hidden';
        this.terminal.style.pointerEvents = 'auto';
        
        // Add scroll event listener
        this.terminal.addEventListener('scroll', () => {
            const isAtBottom = this.terminal.scrollHeight - this.terminal.scrollTop === this.terminal.clientHeight;
            this.isUserScrolling = !isAtBottom;
        }, { passive: true });
        
        // Debug scroll setup
        console.log('Terminal scroll setup:', {
            height: this.terminal.offsetHeight,
            scrollHeight: this.terminal.scrollHeight,
            clientHeight: this.terminal.clientHeight,
            style: window.getComputedStyle(this.terminal)
        });
    }

    initializeInput() {
        if (!this.input) return;

        try {
            // Keep input focused unless selecting text
            document.addEventListener('click', (e) => {
                if (this.input && !window.getSelection().toString().length) {
                    this.input.focus();
                }
            });

            // Handle input events
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const command = this.input.value.trim();
                    if (command) {
                        this.appendLine(`${this.prompt.textContent} ${command}`, 'command');
                        this.processCommand(command);
                        this.history.push(command);
                        this.historyIndex = this.history.length;
                        this.input.value = '';
                    }
                    e.preventDefault();
                }
            });

            // Ensure input is enabled and visible
            this.input.disabled = false;
            this.input.style.display = 'block';
            this.input.focus();
        } catch (error) {
            console.error('Error initializing input:', error);
        }
    }

    scrollToBottom() {
        if (!this.terminal || !this.isInitialized) return;
        
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            const maxScroll = this.terminal.scrollHeight - this.terminal.scrollTop;
            this.terminal.scrollTop = maxScroll;
        });
    }

    appendLine(text, type = '') {
        // Check if terminal exists and is initialized
        if (!this.terminal) {
            console.error('Terminal element not found');
            return null;
        }

        if (!this.isInitialized) {
            console.warn('Terminal not initialized yet');
            return null;
        }

        try {
            // Create the line element
            const line = document.createElement('div');
            
            // Verify line was created
            if (!line) {
                console.error('Failed to create line element');
                return null;
            }

            // Add classes
            line.className = `terminal-line ${type || ''}`.trim();
            
            // Set text content with null check
            if (text !== undefined && text !== null) {
                line.textContent = text;
            } else {
                line.textContent = '';
            }

            // Append to terminal with verification
            if (this.terminal.appendChild) {
                this.terminal.appendChild(line);
                
                // Scroll handling
                if (!this.isUserScrolling) {
                    requestAnimationFrame(() => {
                        this.scrollToBottom();
                    });
                }
                
                return line;
            } else {
                console.error('Terminal element does not support appendChild');
                return null;
            }
        } catch (error) {
            console.error('Error in appendLine:', error);
            console.log('Text:', text);
            console.log('Type:', type);
            console.log('Terminal state:', {
                exists: !!this.terminal,
                initialized: this.isInitialized,
                innerHTML: this.terminal?.innerHTML
            });
            return null;
        }
    }

    processCommand(command) {
        // Parse command and arguments
        const [cmd, ...args] = command.split(' ');
        
        // Execute command if it exists
        if (this.commands[cmd]) {
            this.commands[cmd](...args);
        } else {
            this.appendLine(`Command not found: ${cmd}`, 'error');
            this.appendLine("Type 'help' for available commands", 'system');
        }
        
        // Add to history
        this.history.push(command);
        this.historyIndex = this.history.length;
    }

    async initializeApiKey() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            if (config.success && config.heliusApiKey) {
                this.heliusApiKey = config.heliusApiKey;
                console.log('Helius API key initialized');
            } else {
                throw new Error('API key not found in config');
            }
        } catch (error) {
            console.error('Failed to fetch Helius API key:', error);
            this.appendLine('Warning: API key not configured. Some features may be limited.', 'warning');
        }
    }

    showHelp() {
        this.appendLine('GrassAI Terminal Commands:', 'info');
        this.appendLine('• help - Show this help message');
        this.appendLine('• analyze <address> - Analyze a Solana contract');
        this.appendLine('• ask <question> - Ask GrassAI about the analyzed contract');
        this.appendLine('• clear - Clear the terminal');
        this.appendLine('• version - Show version information');
    }

    clearTerminal() {
        this.terminal.innerHTML = '';
        this.scrollToBottom();
    }

    showHistory() {
        if (this.history.length === 0) {
            this.appendLine('No command history available.');
            return;
        }
        this.appendLine('Command History:');
        this.history.forEach((cmd, i) => {
            this.appendLine(`${i + 1}. ${cmd}`);
        });
    }

    navigateHistory(direction) {
        if (direction === 'up' && this.historyIndex > 0) {
            this.historyIndex--;
            this.input.value = this.history[this.historyIndex];
        } else if (direction === 'down' && this.historyIndex < this.history.length) {
            this.historyIndex++;
            this.input.value = this.history[this.historyIndex] || '';
        }
    }

    showVersion() {
        this.appendLine('GrassAI Terminal v1.0.0', 'info');
        this.appendLine('Your AI-Powered Solana Contract Analyzer', 'system');
    }

    async analyzeContract(address) {
        if (!address) {
            this.appendLine('Error: Please provide a contract address', 'error');
            this.appendLine('Usage: analyze <contract_address>', 'system');
            return;
        }

        let loadingLine;
        let loadingInterval;

        try {
            this.appendLine(`Analyzing contract: ${address}`, 'info');
            
            loadingLine = this.appendLine('Loading market data... ⠋', 'system');
            let loadingFrame = 0;
            const loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
            loadingInterval = setInterval(() => {
                loadingFrame = (loadingFrame + 1) % loadingChars.length;
                loadingLine.textContent = 'Loading market data... ' + loadingChars[loadingFrame];
            }, 100);

            // Fetch market data from DexScreener
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
            const dexResult = await dexResponse.json();
            
            if (!dexResult.pairs || dexResult.pairs.length === 0) {
                throw new Error('Token not found or no trading pairs available');
            }
            
            const pair = dexResult.pairs[0]; // Get the most liquid pair

            // Fetch largest holders using RPC method
            const holdersResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=${this.heliusApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 'grassai',
                    method: 'getTokenLargestAccounts',
                    params: [address]
                })
            });
            const holdersData = await holdersResponse.json();
            
            // Display Token Info
            this.appendLine('\nToken Information:', 'info');
            this.appendLine(`Name: ${pair.baseToken.name}`, 'system');
            this.appendLine(`Symbol: ${pair.baseToken.symbol}`, 'system');
            
            // Display Market Data
            this.appendLine('\nMarket Data:', 'info');
            this.appendLine(`Price: $${this.formatNumber(pair.priceUsd)}`, 'system');
            this.appendLine(`Liquidity: $${this.formatNumber(pair.liquidity.usd)}`, 'system');
            this.appendLine(`24h Volume: $${this.formatNumber(pair.volume.h24)}`, 'system');
            this.appendLine(`24h Price Change: ${pair.priceChange.h24.toFixed(2)}%`, 'system');

            // Display Top Holders
            if (holdersData.result?.value) {
                this.appendLine('\nTop Holders:', 'info');
                const totalSupply = holdersData.result.value.reduce((acc, holder) => acc + Number(holder.amount), 0);
                
                holdersData.result.value.forEach((holder, index) => {
                    const amount = Number(holder.amount);
                    const percentage = ((amount / totalSupply) * 100).toFixed(2);
                    const formattedBalance = (amount / 1e9).toFixed(2); // Adjust decimals based on token
                    this.appendLine(`${index + 1}. ${holder.address}`, 'system');
                    this.appendLine(`   Balance: ${formattedBalance}M (${percentage}%)`, 'detail');
                });
            }

            // Calculate Touch Grass Index
            const volatility = Math.abs(pair.priceChange.h24) / 100;
            const volume = pair.volume.h24;
            const liquidity = pair.liquidity.usd;
            
            const tgiScore = this.calculateTGI(volatility, volume, liquidity);
            
            // Display Touch Grass Index
            this.appendLine('\n📊 Touch Grass Index:', 'info');
            this.appendLine(`Score: ${tgiScore.score.toFixed(1)}`, 'system');
            this.appendLine(`Risk Level: ${tgiScore.riskLevel}`, 'system');
            this.appendLine(`Recommendation: ${tgiScore.recommendation}`, 'system');
            this.appendLine(`${tgiScore.advice}`, 'detail');

            // Store data for conversation
            this.contractData = {
                token: {
                    name: pair.baseToken.name,
                    symbol: pair.baseToken.symbol,
                    address: address
                },
                market: {
                    price: pair.priceUsd,
                    liquidity: pair.liquidity.usd,
                    volume24h: pair.volume.h24,
                    priceChange24h: pair.priceChange.h24
                },
                holders: holdersData.result?.value || [],
                tgi: tgiScore
            };

            // Update loading message for AI analysis
            loadingLine.textContent = 'GrassAI is analyzing the data... 🤖';

            // Get AI summary
            const summaryResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.contractData)
            });

            const summaryResult = await summaryResponse.json();
            
            // Remove loading indicator
            loadingLine.remove();
            
            // Display all data
            this.appendLine('\nToken Information:', 'info');
            this.appendLine(`Name: ${pair.baseToken.name}`, 'system');
            this.appendLine(`Symbol: ${pair.baseToken.symbol}`, 'system');
            
            // ... rest of display code ...

            // Add AI Summary with fancy border
            if (summaryResult.success) {
                this.appendLine('\n╔════ 🤖 GrassAI Analysis ════╗', 'info');
                this.appendLine(summaryResult.summary, 'system');
                this.appendLine('╚════════════════════════════╝', 'info');
                this.appendLine('\n💡 Tip: Use "ask <question>" to inquire about this contract.', 'detail');
            }

        } catch (error) {
            this.appendLine(`Error analyzing contract: ${error.message}`, 'error');
            this.appendLine('Please verify the contract address and try again', 'system');
        } finally {
            if (loadingInterval) clearInterval(loadingInterval);
            if (loadingLine) loadingLine.remove();
        }
    }

    calculateTGI(volatility, volume, liquidity) {
        // Normalize metrics
        const volScore = Math.min(volatility * 100, 100);
        const volWeight = 0.4;
        
        const volumeScore = Math.min((volume / 1000000) * 10, 100);
        const volumeWeight = 0.3;
        
        const liqScore = Math.min((liquidity / 1000000) * 20, 100);
        const liqWeight = 0.3;
        
        // Calculate weighted score
        const score = 100 - ((volScore * volWeight) + (volumeScore * volumeWeight) + (liqScore * liqWeight));
        
        // Determine risk level and recommendations
        let riskLevel, recommendation, advice;
        if (score >= 80) {
            riskLevel = "LOW";
            recommendation = "Safe to Trade 🌿";
            advice = "Market conditions appear stable. Regular grass touching recommended.";
        } else if (score >= 60) {
            riskLevel = "MODERATE";
            recommendation = "Consider Touching Some Grass 🌿";
            advice = "Proceed with caution and maintain grass-touching intervals.";
        } else if (score >= 40) {
            riskLevel = "HIGH";
            recommendation = "Touch Grass Immediately 🌿";
            advice = "High market volatility detected. Extended grass-touching session advised.";
        } else {
            riskLevel = "EXTREME";
            recommendation = "EMERGENCY GRASS TOUCHING REQUIRED 🌿";
            advice = "Extreme market conditions. Seek nearest grass patch immediately.";
        }
        
        return { score, riskLevel, recommendation, advice };
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 6
        }).format(num);
    }

    formatMetricName(key) {
        return key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    initializeHistory() {
        this.history = [];
        this.historyIndex = -1;

        // Handle history navigation
        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        this.input.value = this.history[this.historyIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.historyIndex < this.history.length - 1) {
                        this.historyIndex++;
                        this.input.value = this.history[this.historyIndex];
                    } else {
                        this.historyIndex = this.history.length;
                        this.input.value = '';
                    }
                }
            });
        }
    }

    async askGrassAI(question) {
        if (!this.contractData) {
            this.appendLine('Please analyze a contract first using the "analyze" command.', 'error');
            return;
        }

        let loadingLine;
        let loadingInterval;

        try {
            loadingLine = this.appendLine('GrassAI is thinking... 🌿', 'system');
            let dots = 0;
            loadingInterval = setInterval(() => {
                dots = (dots + 1) % 4;
                loadingLine.textContent = 'GrassAI is thinking' + '.'.repeat(dots) + ' 🌿';
            }, 500);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    contractData: this.contractData
                })
            });

            const result = await response.json();
            
            // Remove loading indicator
            loadingLine.remove();

            if (result.success) {
                this.appendLine('\n╔════ 🌱 GrassAI Response ════╗', 'info');
                this.appendLine(result.response, 'system');
                this.appendLine('╚════════════════════════════╝', 'info');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.appendLine('Error getting response: ' + error.message, 'error');
        } finally {
            if (loadingInterval) clearInterval(loadingInterval);
            if (loadingLine) loadingLine.remove();
        }
    }
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.terminalInterface = new TerminalInterface();
});

function initTerminal() {
    const greeting = `
🌱 Welcome to GrassAI Terminal!
Type 'help' to see available commands.
`;

    terminal.appendLine(greeting);
} 