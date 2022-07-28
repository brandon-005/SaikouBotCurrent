import { model, Schema } from 'mongoose';

import { CorrectTriviaTypes } from '../TS/interfaces';

const correctTriviaSchema: Schema = new Schema({
	userID: { type: String },
	answersCorrect: { type: Number },
});

export = model<CorrectTriviaTypes>('triviaUsers', correctTriviaSchema);
