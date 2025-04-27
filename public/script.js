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
    
    // Initialize form with saved values
    loadSettings();
    
    startBtn.addEventListener('click', startBot);
    stopBtn.addEventListener('click', stopBot);
    
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('gridBotSettings')) || {};
        
        if (savedSettings.apiKey) document.getElementById('apiKey').value = savedSettings.apiKey;
        if (savedSettings.apiSecret) document.getElementById('apiSecret').value = savedSettings.apiSecret;
        if (savedSettings.baseCurrency) document.getElementById('baseCurrency').value = savedSettings.baseCurrency;
        if (savedSettings.pairCurrency) document.getElementById('pairCurrency').value = savedSettings.pairCurrency;
        if (savedSettings.gridLevels) document.getElementById('gridLevels').value = savedSettings.gridLevels;
        if (savedSettings.lowerPrice) document.getElementById('lowerPrice').value = savedSettings.lowerPrice;
        if (savedSettings.upperPrice) document.getElementById('upperPrice').value = savedSettings.upperPrice;
        if (savedSettings.investment) document.getElementById('investment').value = savedSettings.investment;
    }
    
    function saveSettings() {
        const settings = {
            apiKey: document.getElementById('apiKey').value,
            apiSecret: document.getElementById('apiSecret').value,
            baseCurrency: document.getElementById('baseCurrency').value,
            pairCurrency: document.getElementById('pairCurrency').value,
            gridLevels: document.getElementById('gridLevels').value,
            lowerPrice: document.getElementById('lowerPrice').value,
            upperPrice: document.getElementById('upperPrice').value,
            investment: document.getElementById('investment').value
        };
        
        localStorage.setItem('gridBotSettings', JSON.stringify(settings));
    }
    
    function startBot() {
        saveSettings();
        
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
        
        // Simulate price updates and trading (in a real app, this would connect to exchange WebSocket)
        botInterval = setInterval(() => {
            updatePriceAndTrade(baseCurrency, pairCurrency);
        }, 3000);
        
        logTrade('Bot started', 'info');
    }
    
    function stopBot() {
        clearInterval(botInterval);
        botStatus.textContent = 'Inactive';
        botStatus.style.color = 'red';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        logTrade('Bot stopped', 'info');
    }
    
    function createGridLevels(lowerPrice, upperPrice, levels, investment) {
        const grid = [];
        const priceStep = (upperPrice - lowerPrice) / (levels - 1);
        const investmentPerLevel = investment / levels;
        
        for (let i = 0; i < levels; i++) {
            const price = lowerPrice + (i * priceStep);
            grid.push({
                price: parseFloat(price.toFixed(8)),
                type: i % 2 === 0 ? 'buy' : 'sell', // Alternate buy/sell
                amount: investmentPerLevel / price,
                active: false
            });
        }
        
        return grid;
    }
    
    function renderGridLevels(grid) {
        gridLevelsContainer.innerHTML = '';
        
        grid.forEach(level => {
            const levelEl = document.createElement('div');
            levelEl.className = `grid-level ${level.type}-level ${level.active ? 'active-level' : ''}`;
            levelEl.innerHTML = `
                <strong>${level.type.toUpperCase()}</strong><br>
                Price: ${level.price}<br>
                Amount: ${level.amount.toFixed(8)}<br>
                Value: ${(level.price * level.amount).toFixed(4)}
            `;
            gridLevelsContainer.appendChild(levelEl);
        });
    }
    
    async function updatePriceAndTrade(baseCurrency, pairCurrency) {
        try {
            // In a real implementation, this would fetch actual price from exchange API
            const currentPrice = simulatePriceMovement();
            currentPriceEl.textContent = currentPrice;
            
            // Check grid levels for potential trades
            const trades = checkForTrades(currentPrice);
            
            if (trades.length > 0) {
                // Execute trades (in a real app, this would call your exchange API)
                for (const trade of trades) {
                    const result = await executeTrade(trade, baseCurrency, pairCurrency);
                    
                    if (result.success) {
                        logTrade(`${trade.type.toUpperCase()} ${trade.amount} ${pairCurrency} @ ${trade.price}`, trade.type);
                        lastTradePrice = trade.price;
                    }
                }
                
                // Update grid display
                renderGridLevels(currentGrid);
            }
        } catch (error) {
            console.error('Error in trading:', error);
            logTrade(`Error: ${error.message}`, 'error');
        }
    }
    
    function simulatePriceMovement() {
        // Simple random walk price simulation
        if (!lastTradePrice) {
            const lowerPrice = parseFloat(document.getElementById('lowerPrice').value);
            const upperPrice = parseFloat(document.getElementById('upperPrice').value);
            lastTradePrice = lowerPrice + (upperPrice - lowerPrice) / 2;
        }
        
        const changePercent = (Math.random() * 2 - 1) * 0.5; // -0.5% to +0.5%
        lastTradePrice = lastTradePrice * (1 + changePercent / 100);
        
        return lastTradePrice.toFixed(8);
    }
    
    function checkForTrades(currentPrice) {
        const trades = [];
        
        for (const level of currentGrid) {
            if (!level.active) {
                const priceDiff = Math.abs(currentPrice - level.price) / level.price * 100;
                
                if (priceDiff < 0.1) { // Threshold for trade execution
                    level.active = true;
                    trades.push({
                        type: level.type,
                        price: level.price,
                        amount: level.amount
                    });
                }
            }
        }
        
        return trades;
    }
    
    async function executeTrade(trade, baseCurrency, pairCurrency) {
        // In a real implementation, this would call your serverless function to execute the trade
        // For now, we'll simulate a successful trade
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: `Simulated ${trade.type} order executed`
                });
            }, 500);
        });
    }
    
    function logTrade(message, type) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        const entry = document.createElement('div');
        entry.className = `trade-entry trade-${type}`;
        entry.innerHTML = `[${timeString}] ${message}`;
        
        tradeLog.prepend(entry);
        
        // Keep log manageable
        if (tradeLog.children.length > 50) {
            tradeLog.removeChild(tradeLog.lastChild);
        }
    }
});