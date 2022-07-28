import { model, Schema } from 'mongoose';

import { ReportTypes } from '../TS/interfaces';

const suggestionSchema: Schema = new Schema({
	messageID: { type: String, unique: true, required: true },
	userID: { type: String, required: true },
});

export = model<ReportTypes>('reportData', suggestionSchema);
