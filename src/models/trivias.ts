import { model, Schema } from 'mongoose';

import { TriviaTypes } from '../TS/interfaces';

const triviaSchema: Schema = new Schema({
	question: { type: String },
	options: { type: Array },
	answer: { type: String },
	points: { type: Number },
});

export = model<TriviaTypes>('triviaData', triviaSchema);
