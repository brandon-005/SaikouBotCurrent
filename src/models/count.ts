import { model, Schema } from 'mongoose';

import { CountType } from '../TS/interfaces';

const count: Schema = new Schema({
	id: { type: Number },
	count: { type: Number },
});

export = model<CountType>('qotdCount', count);
