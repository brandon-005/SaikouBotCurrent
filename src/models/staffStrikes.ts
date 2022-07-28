import { model, Schema } from 'mongoose';

import { StrikeTypes } from '../TS/interfaces';

const strikeSchema: Schema = new Schema({
	userID: { type: String },
	strikeInfo: { type: Array },
});

export = model<StrikeTypes>('strikeData', strikeSchema);
