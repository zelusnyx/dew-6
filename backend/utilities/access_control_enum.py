import enum
class AccessControlEnum(enum.IntEnum):
	none = 1
	read = 2
	write = 3
	manage = 4