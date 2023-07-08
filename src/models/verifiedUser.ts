import { model, Schema } from 'mongoose';
import { VerifyTypes } from '../TS/interfaces';

const verifySchema: Schema = new Schema({
	robloxName: { type: String },
	robloxID: { type: String },
	userID: { type: String },
	roleName: { type: String },
});

export = model<VerifyTypes>('verifiedUsers', verifySchema);
