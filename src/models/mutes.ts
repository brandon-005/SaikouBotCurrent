import { model, Schema } from 'mongoose';

import { MuteTypes } from '../TS/interfaces';

const muteSchema: Schema = new Schema({
	userID: { type: String },
	timestamp: { type: Date, default: new Date(0) },
	duration: { type: Number },
});

export = model<MuteTypes>('muteData', muteSchema);
