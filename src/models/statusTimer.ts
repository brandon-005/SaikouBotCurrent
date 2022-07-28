import { model, Schema } from 'mongoose';

import { StatusTimerTypes } from '../TS/interfaces';

const statusTimerSchema: Schema = new Schema({
	userID: { type: String },
	timestamp: { type: Number },
	duration: { type: Number },
	status: { type: String },
});

export = model<StatusTimerTypes>('statusTimers', statusTimerSchema);
