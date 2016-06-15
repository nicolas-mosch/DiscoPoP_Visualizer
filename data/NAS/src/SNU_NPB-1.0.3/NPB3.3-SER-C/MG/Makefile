SHELL=/bin/sh
BENCHMARK=mg
BENCHMARKU=MG

include ../config/make.def

include ../sys/make.common

ifdef binaries
PRIMARIES = mg.o

OBJS = primary.o \
       ${COMMON}/print_results.o  \
       ${COMMON}/${RAND}.o \
       ${COMMON}/c_timers.o \
       ${COMMON}/wtime.o
else
PRIMARIES = mg.bc

OBJS = primary.bc \
       ${COMMON}/print_results.bc  \
       ${COMMON}/${RAND}.bc \
       ${COMMON}/c_timers.bc \
       ${COMMON}/wtime.bc
endif

${PROGRAM}: config ${OBJS}
	${CLINK} ${CLINKFLAGS} -o ${PROGRAM} ${OBJS} ${C_LIB}

ifdef binaries
.c.o:
	${CCOMPILE} $<
else
%.bc:%.c globals.h npbparams.h
	${CCOMPILE} $<
endif

primary.o: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.o ${PRIMARIES}

primary.bc: ${PRIMARIES}
	${CLINK_R} ${CLINKFLAGS} -o primary.bc ${PRIMARIES}

mg.o:		mg.c globals.h npbparams.h
mg.bc:		mg.c globals.h npbparams.h

clean:
	- rm -f *.o *~ 
	- rm -f npbparams.h core



