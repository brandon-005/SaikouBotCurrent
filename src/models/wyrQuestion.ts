import { model, Schema } from 'mongoose';

import { QuestionTypes } from '../TS/interfaces';

const questionSchema: Schema = new Schema({
	optionA: { type: String },
	optionB: { type: String },
});

export = model<QuestionTypes>('wyrQuestions', questionSchema);
