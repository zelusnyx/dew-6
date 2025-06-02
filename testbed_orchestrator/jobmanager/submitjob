#!/usr/bin/perl

use IO::Socket::INET;

for ($i=0; $i <= $#ARGV; $i++)
{
    print "$i=$ARGV[$i]\n";
}
$peer = $ARGV[0];
$exp = $ARGV[1];
$proj = $ARGV[2];
$data = $ARGV[3];

my $socket;
$peerad = "$peer.$exp.$proj.isi.deterlab.net:17711";
print "Peer address $peerad\n";
$socket = new IO::Socket::INET (
    PeerAddr => $peerad,
    Proto => 'udp'
    );

print "Peer $peer socket $socket data $data\n";
$socket->send($data);

