import { Document } from 'mongoose';

// --- Suggestion Schema ---
export interface SuggestionTypes extends Document {
	suggestionMessage: string;
	channelID: string;
	messageID: string;
	featured: boolean;
	userID: string;
}

// --- Trivias Schema ---
export interface TriviaTypes extends Document {
	question: string;
	options: string[];
	answer: string;
	points: number;
}

// --- Correct Trivias Schema ---
export interface CorrectTriviaTypes extends Document {
	userID: string;
	answersCorrect: number;
}

// --- Warnings Schema ---
export interface WarningTypes extends Document {
	userID: string;
	warnings: Array;
}

// --- Staff Strike Schema ---
export interface StrikeTypes extends Document {
	userID: string;
	strikeInfo: Array;
}

// --- Report Schema ---
export interface ReportTypes extends Document {
	messageID: string;
	userID: string;
}

// --- Mute Schema ---
export interface MuteTypes extends Document {
	userID: string;
	timestamp: Date;
	duration: number;
}

// --- Economy Schema ---
export interface EconomyTypes extends Document {
	userID: string;
	credits: number;
	medals: number;
	items: [
		{
			_id: any;
			itemName: string;
			itemQuantity: number;
			itemSell: number;
			titleEquipped?: boolean;
			titleColour?: string;
			itemType: string;
			multipurchase: boolean;
		}
	];
}

// --- Status Timer Schema ---
export interface StatusTimerTypes extends Document {
	userID: string;
	timestamp: Date;
	duration: number;
	status: string;
}

// --- Blacklisted Schema ---
export interface BlacklistedTypes extends Document {
	userID: string;
}

// --- Count Schema ---
export interface CountType extends Document {
	id: number;
	count: number;
}
