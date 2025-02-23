// This extracts the strategies from the stake browser cookie. On line 214 is the actual line of code which pulls from local storage. The *only* key interacted with by this script is 'strategies_saved', listed below as a constant. Only use such a tool when interacting with websites where money is involved which is open source and relatively simple, like this.
// by: rubyatmidnight
// stakestats.net

const STRATEGY_KEY = 'strategies_saved';

class StrategyValidator {
	static validConditionTypes = [
		'every',
		'everyStreakOf',
		'streakGreaterThan',
		'streakLowerThan',
		'firstStreakOf',
		'greaterThan',
		'greaterThanOrEqualTo',
		'lessThan',
		'lessThanOrEqualTo'
	];

	static validBetTypes = ['bet', 'win', 'lose'];
	static validProfitTypes = ['profit', 'loss', 'balance'];

	static validActionTypes = [
		'setAmount',
		'setWinChance',
		'increaseWinChanceBy',
		'decreaseWinChanceBy',
		'increaseByPercentage',
		'decreaseByPercentage',
		'addToAmount',
		'subtractFromAmount',
		'addToWinChance',
		'subtractFromWinChance',
		'switchOverUnder',
		'resetAmount',
		'resetWinChance',
		'stop'
	];

	static validateBlock(block) {
		// Required fields check
		if (!block.id || !block.type || !block.on || !block.do) {
			console.warn('Missing required fields in block');
			return false;
		}

		// Type check
		if (!['bets', 'profit'].includes(block.type)) {
			console.warn('Invalid block type:', block.type);
			return false;
		}

		// Validate condition and action
		return this.validateCondition(block.on) && this.validateAction(block.do);
	}

	static validateCondition(condition) {
		// Required fields check
		if (!condition.type || condition.value === undefined || 
			!condition.betType || !condition.profitType) {
			console.warn('Missing required fields in condition');
			return false;
		}

		// Type validations
		if (!this.validConditionTypes.includes(condition.type)) {
			console.warn('Invalid condition type:', condition.type);
			return false;
		}

		if (!this.validBetTypes.includes(condition.betType)) {
			console.warn('Invalid bet type:', condition.betType);
			return false;
		}

		if (!this.validProfitTypes.includes(condition.profitType)) {
			console.warn('Invalid profit type:', condition.profitType);
			return false;
		}

		// Value type check
		if (typeof condition.value !== 'number') {
			console.warn('Condition value must be a number');
			return false;
		}

		return true;
	}

	static validateAction(action) {
		// Required fields check
		if (!action.type || action.value === undefined) {
			console.warn('Missing required fields in action');
			return false;
		}

		// Type validation
		if (!this.validActionTypes.includes(action.type)) {
			console.warn('Invalid action type:', action.type);
			return false;
		}

		// Value type check
		if (typeof action.value !== 'number') {
			console.warn('Action value must be a number');
			return false;
		}

		return true;
	}
}

class StrategyManager {
	static validateStrategy(strategy) {
		// Check basic structure
		if (!strategy || typeof strategy !== 'object') {
			console.warn('Invalid strategy object');
			return false;
		}

		// Check required fields
		if (!strategy.label || !Array.isArray(strategy.blocks)) {
			console.warn('Missing required fields in strategy');
			return false;
		}

		// isDefault should be boolean
		if (typeof strategy.isDefault !== 'boolean') {
			console.warn('isDefault must be boolean');
			return false;
		}

		// Validate all blocks
		return strategy.blocks.every(block => StrategyValidator.validateBlock(block));
	}

	static exportStrategies(format = 'original') {
		try {
			const strategies = localStorage.getItem(STRATEGY_KEY);
			if (!strategies) {
				console.warn('No strategies found in localStorage!');
				return null;
			}

			const parsedStrategies = JSON.parse(strategies);
			
			// Validate before export
			if (!Array.isArray(parsedStrategies) || 
				!parsedStrategies.every(this.validateStrategy)) {
				throw new Error('Invalid strategy format detected');
			}
			
			let exportData = strategies;
			if (format === 'shorthand') {
				exportData = JSON.stringify(StrategyConverter.toShorthand(parsedStrategies));
			}
			
			// Create download
			const blob = new Blob([exportData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			
			const a = document.createElement('a');
			a.href = url;
			a.download = `strategies_${format}_${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			
			// Cleanup
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			return exportData;
		} catch (error) {
			console.error('Failed to export strategies:', error);
			throw error;
		}
	}

	static async importStrategies(fileInput, format = 'original') {
		return new Promise((resolve, reject) => {
			const file = fileInput.files[0];
			if (!file) {
				reject(new Error('No file selected'));
				return;
			}

			const reader = new FileReader();
			reader.onload = (event) => {
				try {
					let content = event.target.result;
					let parsedContent = JSON.parse(content);
					
					if (format === 'shorthand') {
						parsedContent = StrategyConverter.fromShorthand(parsedContent);
					}
					
					// Validate strategies
					if (!Array.isArray(parsedContent) || 
						!parsedContent.every(this.validateStrategy)) {
						throw new Error('Invalid strategy format');
					}
					
					localStorage.setItem(STRATEGY_KEY, JSON.stringify(parsedContent));
					resolve(parsedContent);
				} catch (error) {
					reject(new Error(`Invalid strategy file: ${error.message}`));
				}
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	static getStrategies(format = 'original') {
		try {
			const strategies = localStorage.getItem(STRATEGY_KEY);
			if (!strategies) return null;
			
			const parsedStrategies = JSON.parse(strategies);
			
			if (!Array.isArray(parsedStrategies) || 
				!parsedStrategies.every(this.validateStrategy)) {
				throw new Error('Invalid strategy format detected in localStorage, check you are on the right website');
			}
			
			if (format === 'shorthand') {
				return StrategyConverter.toShorthand(parsedStrategies);
			}
			
			return parsedStrategies;
		} catch (error) {
			console.error('Failed to get strategies:', error);
			throw error;
		}
	}
}


StrategyManager.exportStrategies();
