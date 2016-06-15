SHELL=/bin/sh
BENCHMARK=is
BENCHMARKU=IS

include ../config/make.def

include ../sys/make.common

ifdef binaries
OBJS = primary.o \
       ${COMMON}/c_print_results.o \
       ${COMMON}/c_timers.o \
       ${COMMON}/c_wtime.o

PRIMARIES = is.o
else
OBJS = primary.bc \
       ${COMMON}/c_print_results.bc \
       ${COMMON}/c_timers.bc \
       ${COMMON}/c_wtime.bc

PRIMARIES = is.bc
endif

${PROGRAM}: config ${OBJS}
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c npbparams.h
	${CCOMPILE} $<
endif

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

is.o:             is.c  npbparams.h
is.bc:             is.c  npbparams.h


clean:
	- rm -f *.o *.bc *~ mputil*
	- rm -f npbparams.h core
