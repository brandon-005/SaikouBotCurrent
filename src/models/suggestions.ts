import { model, Schema } from 'mongoose';

import { SuggestionTypes } from '../TS/interfaces';

const suggestionSchema: Schema = new Schema({
	suggestionMessage: { type: String, required: true },
	channelID: { type: String, required: true },
	messageID: { type: String, unique: true, required: true },
	featured: { type: Boolean, required: true, default: false },
	featuredMessageID: { type: String, unique: true, required: false },
	userID: { type: String, required: true },
});

export = model<SuggestionTypes>('suggestionData', suggestionSchema);
