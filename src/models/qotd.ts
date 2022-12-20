import { model, Schema } from 'mongoose';

import { QOTDTypes } from '../TS/interfaces';

const qotdSchema: Schema = new Schema({
	question: { type: String },
});

export = model<QOTDTypes>('qotdQuestions', qotdSchema);
