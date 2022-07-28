import { model, Schema } from 'mongoose';

import { EconomyTypes } from '../TS/interfaces';

const staffPointSchema: Schema = new Schema({
	userID: { type: String },
	credits: { type: Number },
	medals: { type: Number },
});

export = model<EconomyTypes>('economyData', staffPointSchema);
