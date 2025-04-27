document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBot');
    const stopBtn = document.getElementById('stopBot');
    const botStatus = document.getElementById('botStatus');
    const currentPriceEl = document.getElementById('currentPrice');
    const gridLevelsContainer = document.getElementById('gridLevelsContainer');
    const tradeLog = document.getElementById('tradeLog');
    
    let botInterval;
    let currentGrid = [];
    let lastTradePrice = 0;
    let authToken = null;
    
    // Initialize
    loadSettings();
    
    // Event listeners
    startBtn.addEventListener('click', startBot);
    stopBtn.addEventListener('click', stopBot);
    
    // Authenticate with backend
    async function authenticate() {
        try {
            const response = await fetch('/api/auth', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.token) {
                authToken = data.token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }
    
    async function startBot() {
        const isAuthenticated = await authenticate();
        if (!isAuthenticated) {
            alert('Failed to authenticate with trading server');
            return;
        }
        
        const baseCurrency = document.getElementById('baseCurrency').value;
        const pairCurrency = document.getElementById('pairCurrency').value;
        const gridLevels = parseInt(document.getElementById('gridLevels').value);
        const lowerPrice = parseFloat(document.getElementById('lowerPrice').value);
        const upperPrice = parseFloat(document.getElementById('upperPrice').value);
        const investment = parseFloat(document.getElementById('investment').value);
        
        if (!baseCurrency || !pairCurrency || isNaN(gridLevels) || isNaN(lowerPrice) || 
            isNaN(upperPrice) || isNaN(investment) || lowerPrice >= upperPrice) {
            alert('Please fill all fields with valid values');
            return;
        }
        
        // Create grid levels
        currentGrid = createGridLevels(lowerPrice, upperPrice, gridLevels, investment);
        renderGridLevels(currentGrid);
        
        // Start bot
        botStatus.textContent = 'Active';
        botStatus.style.color = 'green';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // Start price updates and trading
        botInterval = setInterval(() => {
            updatePriceAndTrade(baseCurrency, pairCurrency);
        }, 5000); // 5 second interval to avoid rate limiting
        
        logTrade('Bot started', 'info');
    }
    
    async function updatePriceAndTrade(baseCurrency, pairCurrency) {
        try {
            const symbol = `${pairCurrency}${baseCurrency}`;
            
            // Get current price from backend
            const priceResponse = await fetch(`/api/price?symbol=${symbol}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const priceData = await priceResponse.json();
            if (!priceData.price) throw new Error('Failed to get price');
            
            const currentPrice = parseFloat(priceData.price);
            currentPriceEl.textContent = currentPrice.toFixed(8);
            
            // Check grid levels for potential trades
            const trades = checkForTrades(currentPrice);
            
            if (trades.length > 0) {
                for (const trade of trades) {
                    const tradeResponse = await fetch('/api/trade', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify({
                            symbol: `${pairCurrency}${baseCurrency}`,
                            type: trade.type,
                            price: trade.price,
                            amount: trade.amount
                        })
                    });
                    
                    const tradeResult = await tradeResponse.json();
                    if (tradeResult.success) {
                        logTrade(`${trade.type.toUpperCase()} ${trade.amount} ${pairCurrency} @ ${trade.price}`, trade.type);
                        lastTradePrice = trade.price;
                    }
                }
                
                renderGridLevels(currentGrid);
            }
        } catch (error) {
            console.error('Trading error:', error);
            logTrade(`Error: ${error.message}`, 'error');
        }
    }
    
    // ... (rest of the client-side code remains similar to previous example)
});