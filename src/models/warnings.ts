import { model, Schema } from 'mongoose';

import { WarningTypes } from '../TS/interfaces';

const warningsSchema: Schema = new Schema({
	userID: { type: String },
	warnings: { type: Array },
});

export = model<WarningTypes>('warnData', warningsSchema);
